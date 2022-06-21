
import constants from '@/constants';

const { Entity } = constants;

const circuits = [
  {
    name: 'Mouse SSCx.S1',
    type: Entity.CIRCUIT,
    urlName: 'mouse-ssx-s1-v6a-20171206',
    path: '/gpfs/bbp.cscs.ch/project/proj64/var/git/circuits/S1.v6a/20171206/CircuitConfig',
    simModel: 'neocortexV6',
    description: 'Somatosensory cortex S1 V6 release from 2017.',
  },
  {
    name: 'Mouse SSCx.O1 (20180305)',
    type: Entity.CIRCUIT,
    urlName: 'mouse-ssx-o1-20180305',
    path: '/gpfs/bbp.cscs.ch/project/proj66/circuits/O1/20180305/CircuitConfig',
    simModel: 'mousify',
    description: '',
    examples: [{
      key: 'Martinotti loop',
      label: 'Martinotti loop',
      gids: [24671, 23233, 22724],
      description: 'Martinotti cell L5_MC, gid: 24671, \nL5_TPC:A with reciprocal connections, gid: 23233\nPost synaptic L5_TPC:A, gid: 22724',
    }],
  },
  {
    name: 'Rat CA1.O1 (20181114)',
    type: Entity.CIRCUIT,
    urlName: 'rat-ca1-o1-20181114',
    path: '/gpfs/bbp.cscs.ch/project/proj42/circuits/CA1.O1/20181114/CircuitConfig',
    simModel: 'hippocampus',
    description: '',
  },
  {
    name: 'Rat CA1.O1 (20191017)',
    type: Entity.CIRCUIT,
    urlName: 'rat-ca1-o1-20191017',
    path: '/gpfs/bbp.cscs.ch/project/proj42/circuits/CA1.O1/20191017/CircuitConfig',
    simModel: 'hippocampus',
    description: '',
  },
  {
    name: 'Rat CA1.O1 (MOOC)',
    type: Entity.CIRCUIT,
    urlName: 'rat-ca1-o1-mooc',
    path: '/gpfs/bbp.cscs.ch/project/proj42/circuits/CA1.O1/mooc-circuit/CircuitConfig',
    simModel: 'hippocampus',
    description: '',
  },
  {
    name: 'Rat CA1 (20180309)',
    type: Entity.CIRCUIT,
    urlName: 'rat-ca1',
    path: '/gpfs/bbp.cscs.ch/project/proj42/circuits/rat.CA1/20180309/CircuitConfig',
    simModel: 'hippocampus',
    description: '',
  },
  {
    name: 'Rat CA1 (20211110-BioM)',
    type: Entity.CIRCUIT,
    urlName: 'rat-ca1-20211110-biom',
    path: '/gpfs/bbp.cscs.ch/project/proj112/circuits/CA1/20211110-BioM/CircuitConfig',
    simModel: 'hippocampus',
    description: '',
  },
  {
    name: 'Rat CA1 (20181114)',
    type: Entity.CIRCUIT,
    urlName: 'rat-ca1',
    path: '/gpfs/bbp.cscs.ch/project/proj42/circuits/CA1/20181114/CircuitConfig',
    simModel: 'hippocampus',
    description: '',
  },
  {
    name: 'Mouse SSCx.O1 (20180305)',
    type: Entity.SIMULATION,
    urlName: 'mouse-o1',
    path: '/gpfs/bbp.cscs.ch/project/proj66/simulations/MouseSScx.O1/20180305/decoupled_depolarization/depolarization100p0/seed234626/BlueConfig',
    simModel: 'mousify',
    description: 'decoupled_depolarization',
  },
];

const defaultConfig = {
  singleCircuit: process.env.VUE_APP_SINGLE_CIRCUIT,
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
