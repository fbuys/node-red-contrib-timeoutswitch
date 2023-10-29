module.exports = function (RED) {
  RED.nodes.registerType("timeoutswitch", function (config) {
    RED.nodes.createNode(this, config);
    const node = this;

    node.timeoutswitch = require("./lib/timeoutswitch")();

    let outputState = ""; // so we dont send msgs if we dont have to
    let ticker = null; // so we can destroy it when needed

    node.timeoutswitch.create();
    node.timeoutswitch.register(alarm);
    /* disable timeoutswitch if configured as such */
    if (config.disabled) node.timeoutswitch.disable();

    /* handle incoming msgs */
    node.on("input", function (msg) {
      const command = msg.payload;
      const seconds = parseInt(command, 10);

      if (seconds && seconds > 0) {
        node.timeoutswitch.start(seconds);
      }

      // Version 2 will allow manual on and off override/pass through.
      // So users can turn a device on without timeout or off to clear any current timeouts.

      // Update status every second while timeoutswitch is on
      ticker = setInterval(() => {
        status();
        if (node.timeoutswitch.state() === "off") {
          clearTicker();
        }
      }, 1000);

      status();
      send();
    });

    // clean up after close
    node.on("close", function () {
      node.timeoutswitch.clear();
      clearTicker()
    });

    // done

    function clearTicker() {
      if (ticker === "off") {
        clearInterval(ticker);
        ticker = null;
      }
    }

    function alarm() {
      status();
      send();
    }

    function status() {
      let text = " (off)";
      let color = "red";
      const state = node.timeoutswitch.state();
      const disabled = node.timeoutswitch.disabled();


      if (!disabled && state === "on") {
        // display remaing time in on state
        const now = new Date();
        const until = node.timeoutswitch.timeoutAt();
        const dif = Math.round((until.getTime() - now.getTime()) / 1000);
        color = "green";
        text = " (on) remaining: " + secondsToString(Math.abs(dif));
      } else if (disabled) {
        color = "grey";
        text = " (disabled)";
      }

      node.status({ fill: color, shape: "dot", text });
    }

    function send(msg) {
      if (typeof msg === "undefined") msg = { topic: "" };

      const state = node.timeoutswitch.state();

      // if we dont know the state, dont send a msg
      if (!state) return;

      // if state hasnt changed, just return
      if (state === outputState) return;

      outputState = state;
      if (state === "on") {
        msg.payload = config.onpayload || state;
        msg.topic = config.ontopic || msg.topic;
      } else {
        msg.payload = config.offpayload || state;
        msg.topic = config.offtopic || msg.topic;
      }
      node.send(msg);
    }

    function secondsToString(seconds) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = (seconds % 3600) % 60;
      const pad = (number) => String(number).padStart(2, "0");
      return `${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`;
    }
  });
};
