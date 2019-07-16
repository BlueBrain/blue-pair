
import constants from '@/constants';

const { Entity } = constants;

const circuits = [{
  name: 'Mouse SSCX.O1 (20180305)',
  type: Entity.CIRCUIT,
  urlName: 'mouse-ssx-o1-20180305',
  path: '/gpfs/bbp.cscs.ch/project/proj66/circuits/O1/20180305/CircuitConfig',
  neurodamusBranch: 'sandbox/vangeit/mousify',
  description: '',
  examples: [{
    key: 'Martinotti loop',
    label: 'Martinotti loop',
    gids: [24671, 23233, 22724],
    description: 'Martinotti cell L5_MC, gid: 24671, \nL5_TPC:A with reciprocal connections, gid: 23233\nPost synaptic L5_TPC:A, gid: 22724',
  }],
}, {
  name: 'Rat CA1.O1 (20181114)',
  type: Entity.CIRCUIT,
  urlName: 'rat-ca1-o1-20181114',
  path: '/gpfs/bbp.cscs.ch/project/proj42/circuits/CA1.O1/20181114/CircuitConfig',
  neurodamusBranch: 'sandbox/king/hippocampus',
  description: '',
}, {
  name: 'Rat CA1 (20181114)',
  type: Entity.CIRCUIT,
  urlName: 'rat-ca1',
  path: '/gpfs/bbp.cscs.ch/project/proj42/circuits/CA1/20181114/CircuitConfig',
  neurodamusBranch: 'sandbox/king/hippocampus',
  description: '',
}, {
  name: 'Mouse SSCX.O1 (20180305)',
  type: Entity.SIMULATION,
  urlName: 'mouse-o1',
  path: '/gpfs/bbp.cscs.ch/project/proj66/simulations/MouseSScx.O1/20180305/decoupled_depolarization/depolarization100p0/seed234626/BlueConfig',
  neurodamusBranch: 'sandbox/vangeit/mousify',
  description: 'decoupled_depolarization',
}];

const defaultConfig = {
  maintenance: !!process.env.VUE_APP_MAINTENANCE,
};

const devConfig = {
  server: {
    host: 'localhost',
    port: 8888,
  },
};

const prodConfig = {};

const prodMode = process.env.NODE_ENV === 'production';

const config = Object.assign(
  { circuits },
  defaultConfig,
  prodMode ? prodConfig : devConfig,
);

export default config;
