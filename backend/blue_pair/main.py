
import os
import json
import logging
import sys
import signal

import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.log import enable_pretty_logging
from .sim_manager import SimStatus


enable_pretty_logging()
L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)


from .storage import Storage
from .utils import NumpyAwareJSONEncoder
from .sim_manager import SimManager

L.debug('creating storage instance')
STORAGE = Storage()
L.debug('storage instance has been created')

SIM_MANAGER = SimManager()

def on_terminate(signal, frame):
    L.debug('received shutdown signal')
    SIM_MANAGER.terminate()
    tornado.ioloop.IOLoop.current().stop()

signal.signal(signal.SIGINT, on_terminate)
signal.signal(signal.SIGTERM, on_terminate)


class WSHandler(tornado.websocket.WebSocketHandler):
    sim_id = None
    closed = False

    def check_origin(self, origin):
        L.debug('websocket client has been connected')
        return True

    @tornado.web.asynchronous
    def on_message(self, msg):
        msg = json.loads(msg)
        L.debug('got ws message: %s', msg)
        cmd = msg['cmd']
        cmdid = msg['cmdid']
        context = msg['context']
        circut_config = context['circuitConfig']

        if 'circuitConfig' in context:
            circuit_path = context['circuitConfig']['path']

        if cmd == 'get_circuit_cells':
            cells = STORAGE.get_circuit_cells(circuit_path)
            cell_count = len(cells)

            L.debug('sending circuit cell properties to the client')
            circuit_info = {
                'properties': cells.columns.tolist(),
                'count': cell_count
            }
            self.send_message('circuit_cell_info', circuit_info)

            def generate_cell_chunks():
                current_index = 0
                chunk_size = int(cell_count / 100)
                while current_index < cell_count:
                    cell_data_chunk = cells[current_index : current_index + chunk_size]
                    L.debug('cell data chunk for cells %s:%s is ready to be sent', current_index, current_index + chunk_size)
                    yield cell_data_chunk
                    current_index = current_index + chunk_size

            cell_chunks_it = generate_cell_chunks()

            def send():
                cell_chunk = next(cell_chunks_it, None)
                if cell_chunk is not None:
                    self.send_message('circuit_cells_data', cell_chunk.values)
                    tornado.ioloop.IOLoop.current().add_callback(send)

            tornado.ioloop.IOLoop.current().add_callback(send)

        elif cmd == 'get_cell_connectome':
            gid = msg['data']
            connectome = STORAGE.get_connectome(circuit_path, gid)
            connectome['cmdid'] = cmdid

            L.debug('sending cell connectome to the client')
            self.send_message('cell_connectome', connectome)

        elif cmd == 'get_syn_connections':
            gids = msg['data']
            connections = STORAGE.get_syn_connections(circuit_path, gids)
            connections['cmdid'] = cmdid

            L.debug('sending syn connections to the client')
            self.send_message('syn_connections', connections)

        elif cmd == 'get_cell_morphology':
            gids = msg['data']
            cell_nm_morph = STORAGE.get_cell_morphology(circuit_path, gids)
            cell_nm_morph['cmdid'] = cmdid

            L.debug('sending cell morphology to the client')
            self.send_message('cell_morphology', cell_nm_morph)

        elif cmd == 'run_simulation':
            simulator_config = msg['data']
            socket = self
            IOLoop = tornado.ioloop.IOLoop.current()
            def send_sim_data(sim_data):
                if sim_data.status == SimStatus.QUEUE:
                    socket.send_message('simulation_queued', sim_data.data)
                elif sim_data.status == SimStatus.CH_MECH_COMPILE:
                    socket.send_message('simulation_compile_ch_mech')
                elif sim_data.status == SimStatus.CH_MECH_COMPILE_ERR:
                    socket.send_message('simulation_compile_ch_mech_err', sim_data.data)
                elif sim_data.status == SimStatus.INIT:
                    socket.send_message('simulation_init')
                elif sim_data.status == SimStatus.FINISH:
                    socket.send_message('simulation_finish')
                    socket.sim_id = None
                else:
                    socket.send_message('simulation_result', sim_data.data)
            def cb(sim_data):
                IOLoop.add_callback(send_sim_data, sim_data)
            self.sim_id = SIM_MANAGER.create_sim(circut_config, simulator_config, cb)

        elif cmd == 'cancel_simulation':
            if self.sim_id is not None:
                SIM_MANAGER.cancel_sim(self.sim_id)
                self.sim_id = None

    def send_message(self, cmd, data=None):
        if not self.closed:
            payload = json.dumps({'cmd': cmd, 'data': data},
                                 cls=NumpyAwareJSONEncoder)
            self.write_message(payload)

    def on_close(self):
        self.closed = True
        if self.sim_id is not None:
            SIM_MANAGER.cancel_sim(self.sim_id)


if __name__ == '__main__':
    app = tornado.web.Application([
        (r'/ws', WSHandler),
    ])
    L.debug('starting tornado io loop')
    app.listen(8000)
    tornado.ioloop.IOLoop.current().start()
