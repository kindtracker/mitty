window.mtiles = {
  "mitty:grass": {
    pos: [3, 11],
    hardness: 0.1
  },
  "mitty:dirt": {
    pos: [9, 3],
    hardness: 0.1
  },
  "mitty:stone": {
    pos: [20, 14],
    hardness: 0.1
  },
  "mitty:oak/log": {
    pos: [7, 14],
    hardness: 0.1,
    tl: true
  },
  "mitty:oak/leaves": {
    pos: [9, 13],
    hardness: 0.1,
    tl: true
  },
  "mitty:breaking:1": {
    pos: [0, 8]
  },
  "mitty:breaking:2": {
    pos: [1, 8]
  },
  "mitty:breaking:3": {
    pos: [2, 8]
  },
  "mitty:breaking:4": {
    pos: [3, 8]
  },
  "mitty:breaking:5": {
    pos: [4, 8]
  },
  "mitty:breaking:6": {
    pos: [5, 8]
  },
  "mitty:breaking:7": {
    pos: [6, 8]
  }
}

for (let [k, v] of Object.entries(window.mtiles)) {
  v.name = k;
}
