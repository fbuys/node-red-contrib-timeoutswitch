module.exports = function () {
  "use strict";

  const timeoutswitch = {
    _disabled: false,
    _state: false,
    _timeoutId: null,
  };
  let self = null;

  timeoutswitch.clear = function () {
    if (self._timeoutId) {
      clearTimeout(self._timeoutId);
    }
    self._disabled = false;
    self._state = false;
    self._timeoutId = null;
  };

  // Initialise a timeoutswitch
  timeoutswitch.create = function () {
    self = this;

    self._disabled = false;
    self._state = false;

    /* set initial state to off */
    self.state("off");
  };

  // Return disable status
  timeoutswitch.disabled = function () {
    return self._disabled;
  };

  timeoutswitch.register = function (alarm) {
    self.alarm = alarm;
  };

  timeoutswitch.start = function (seconds) {
    self.clear();
    self.state("on");

    const now = new Date();
    self._timeoutAt = new Date(now.getTime() + seconds * 1000);

    self._timeoutId = setTimeout(() => {
      self.state("off");
      self.alarm();
    }, seconds * 1000);
  };

  /* set or get the current state */
  timeoutswitch.state = function (state) {
    if (typeof state === "undefined") return self._state;
    self._state = state;
  };

  timeoutswitch.timeoutAt = function () {
    return self._timeoutAt;
  };

  return timeoutswitch;
};
