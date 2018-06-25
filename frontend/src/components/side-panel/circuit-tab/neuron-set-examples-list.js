
const circuitName = process.env.VUE_APP_CIRCUIT_NAME;

const examples = {
  'mouse-o1': [{
    key: 'Martinotti loop',
    label: 'Martinotti loop',
    gids: [24671, 23233, 22724],
    description: 'Martinotti cell L5_MC, gid: 24671, \nL5_TPC:A with reciprocal connections, gid: 23233\nPost synaptic L5_TPC:A, gid: 22724',
  }],
};

export default examples[circuitName];
