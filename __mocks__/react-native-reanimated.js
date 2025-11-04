const Reanimated = require('react-native-reanimated/mock');

// Override default mock to provide better mocking
Reanimated.default.call = () => {};

// Add missing mocked functions
Reanimated.default.Value = class Value {
  constructor(value) {
    this.value = value;
  }
  
  setValue(value) {
    this.value = value;
  }
};

Reanimated.default.timing = (value, config) => {
  return {
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  };
};

Reanimated.default.spring = (value, config) => {
  return {
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  };
};

Reanimated.default.loop = (animation) => {
  return {
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  };
};

Reanimated.default.sequence = (animations) => {
  return {
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
    stop: () => {},
  };
};

module.exports = Reanimated;
