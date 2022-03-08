
import os
import logging
import numpy as np

import bluepy

from bluepy.enums import Synapse

from .redis_client import RedisClient

L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)

L.debug('creating cache client')
cache = RedisClient()
L.debug('cache client has been created')

SEC_SHORT_TYPE_DICT = {
    'soma': 'soma',
    'SOMA_SIMPLE_CONTOUR': 'soma',
    'basal_dendrite': 'dend',
    'apical_dendrite': 'apic',
    'axon': 'axon'
}

circuit_cache = {}

def get_circuit(circuit_path):
    # TODO: limit amount of circuits
    global circuit_cache
    if circuit_path in circuit_cache:
        L.debug('Using cached circuit for {}'.format(circuit_path))
        return circuit_cache[circuit_path]

    L.debug('Creating bluepy circuit for {}'.format(circuit_path))
    circuit = bluepy.Circuit(circuit_path)
    circuit_cache[circuit_path] = circuit
    return circuit

def nm_sections_to_collection(nm_sections):
    '''
    Convert neurom sections into a collection with the following structure:
    * points: [x, y, z, diameter]
    * id
    * type
    '''
    return [
        {
            'points': np.column_stack((section.points, section.diameters)),
            'id': section.id if hasattr(section, 'id') else 0,
            'type': SEC_SHORT_TYPE_DICT[section.type.name]
        }
        for section
        in nm_sections
    ]


class Storage():
    def get_circuit_cells(self, circuit_path):
        L.debug('getting cells')
        circuit = get_circuit(circuit_path)
        cells = cache.get('circuit:cells')
        if cells is None:
            cells = circuit.cells.get().drop(['orientation', 'synapse_class'], 1, errors='ignore');
            cache.set('circuit:cells', cells)
        L.debug('getting cells done')
        return cells

    def get_connectome(self, circuit_path, gid):
        L.debug('getting connectome for %s', gid)
        circuit = get_circuit(circuit_path)
        connectome = cache.get('circuit:connectome:{}'.format(gid))
        if connectome is None:
            connectome = {
                'afferent': circuit.connectome.afferent_gids(gid),
                'efferent': circuit.connectome.efferent_gids(gid)
            }
            cache.set('circuit:connectome:{}'.format(gid), connectome)
        L.debug('getting connectome for %s done', gid)
        return connectome

    def get_syn_connections(self, circuit_path, gids):
        L.debug('getting syn connections for %s', gids)
        circuit = get_circuit(circuit_path)

        props = [
            Synapse.POST_X_CENTER,
            Synapse.POST_Y_CENTER,
            Synapse.POST_Z_CENTER,
            Synapse.TYPE,
            Synapse.PRE_GID,
            Synapse.PRE_SECTION_ID,
            Synapse.POST_GID,
            Synapse.POST_SECTION_ID
        ]

        props_str = [
            'postXCenter',
            'postYCenter',
            'postZCenter',
            'type',
            'preGid',
            'preSectionGid',
            'postGid',
            'postSectionId'
        ]

        syn_dict = {}

        for gid in gids:
            L.debug('getting afferent synapses for %s', gid)
            syn_dict[gid] = circuit.connectome.afferent_synapses(gid, properties=props).values.tolist()

        L.debug('getting syn connections for %s done', gids)

        return {
            'connections': syn_dict,
            'connection_properties': props_str
        }

    def get_cell_morphology(self, circuit_path, gids):
        L.debug('getting cell morph for %s', gids)
        circuit = get_circuit(circuit_path)
        cells = {}
        for gid in gids:
            cell_morph = cache.get('cell:morph:{}'.format(gid))
            if cell_morph is None:
                cell = circuit.morph.get(gid, transform=True)
                morphology = nm_sections_to_collection([cell.soma]) + nm_sections_to_collection(cell.sections)

                cache.set('cell:morph:{}'.format(gid), morphology)

                orientation = circuit.cells.get(gid)['orientation']

                cells[gid] = {
                    'sections': morphology,
                    'orientation': orientation
                }
        L.debug('getting cell morph for %s done', gids)
        return {'cells': cells}
