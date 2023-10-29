const helper = require("node-red-node-test-helper");
const timeoutswitchNode = require("../timeoutswitch.js");

jest.useFakeTimers();
jest.spyOn(global, "setTimeout");
jest.spyOn(global, "setInterval");
jest.spyOn(global, "clearTimeout");

describe("timeoutswitchNode", () => {
  afterEach(() => {
    helper.unload();
    jest.clearAllMocks();
  });

  let FLOW = [{ id: "n1", type: "timeoutswitch" }];

  const getNode = async (nodeId) => {
    let node = null;
    await helper.load(timeoutswitchNode, FLOW, () => {
      node = helper.getNode(nodeId);
    });
    return node;
  };

  describe("send", () => {
    it("sends on instantly", async () => {
      const n = await getNode("n1");
      n.send = jest.fn();

      n.receive({ payload: 2 });

      expect(n.send.mock.calls).toHaveLength(1);
      expect(n.send.mock.calls[0][0].payload).toBe("on");
      expect(n.timeoutswitch.state()).toBe("on");
    });

    it("stays on but sends no additinal messages", async () => {
      const n = await getNode("n1");
      n.send = jest.fn();

      n.receive({ payload: 2 });
      jest.advanceTimersByTime(1000);

      expect(n.send.mock.calls).toHaveLength(1);
      expect(n.send.mock.calls[0][0].payload).toBe("on");
      expect(n.timeoutswitch.state()).toBe("on");
    });

    it("sends off after timeout", async () => {
      const n = await getNode("n1");
      n.send = jest.fn();

      n.receive({ payload: 2 });
      jest.advanceTimersByTime(2000);

      expect(n.send.mock.calls).toHaveLength(2);
      expect(n.send.mock.calls[1][0].payload).toBe("off");
      expect(n.timeoutswitch.state()).toBe("off");
    });
  });

  describe("status", () => {
    it("sets the status to time remaining", async () => {
      const n = await getNode("n1");
      n.status = jest.fn();

      n.receive({ payload: 2 });

      expect(n.status.mock.calls).toHaveLength(1);
      expect(n.status.mock.calls[0][0]).toEqual({
        fill: "green",
        shape: "dot",
        text: " (on) remaining: 00h 00m 02s",
      });
      expect(n.timeoutswitch.state()).toBe("on");
    });

    it("updates the status as time passes", async () => {
      const n = await getNode("n1");
      n.status = jest.fn();

      n.receive({ payload: 2 });
      jest.advanceTimersByTime(1000);

      expect(n.status.mock.calls).toHaveLength(2);
      expect(n.status.mock.calls[1][0]).toEqual({
        fill: "green",
        shape: "dot",
        text: " (on) remaining: 00h 00m 01s",
      });
      expect(n.timeoutswitch.state()).toBe("on");
    });

    it("updates the status to off when time elapses", async () => {
      const n = await getNode("n1");
      n.status = jest.fn();

      n.receive({ payload: 2 });
      jest.advanceTimersByTime(2000);

      expect(n.status.mock.calls).toHaveLength(4); // twice at the
      expect(n.status.mock.calls[3][0]).toEqual({
        fill: "red",
        shape: "dot",
        text: " (off)",
      });
      expect(n.timeoutswitch.state()).toBe("off");
    });
  });

  it("resets the timeoute upon subsequent inputs", async () => {
    const n = await getNode("n1");

    n.receive({ payload: 2 });
    jest.clearAllMocks();
    jest.advanceTimersByTime(1000);
    n.receive({ payload: 2 });

    const now = new Date();
    const until = n.timeoutswitch.timeoutAt();
    const dif = Math.round((until.getTime() - now.getTime()) / 1000);

    expect(clearTimeout.mock.calls).toHaveLength(1);
    expect(dif).toBe(2)
  });
});
