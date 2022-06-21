export type AppQueryParams = {
  view: 'circuit' | 'simConfig';
  circuit: {
    gids: number[];
    connFilter: any; // TODO
    displayFilter: any; // TODO
    name: string;
    path: string;
    simModel: string;
  };
  simConfig: {
    synInputs: any; // TODO
    stimuli: any; // TODO
    recordings: any; // TODO
  };
  camera: {
    up: number;
    target: number[];
    rotation: number[];
    zoom: number;
  };
};
