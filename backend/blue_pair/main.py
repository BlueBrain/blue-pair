
import os
import time
import json
import logging

import tornado.ioloop
import tornado.web
import tornado.websocket

from tornado.log import enable_pretty_logging


enable_pretty_logging()
L = logging.getLogger(__name__)
L.setLevel(logging.DEBUG if os.getenv('DEBUG', False) else logging.INFO)

circuit_path = os.environ['CIRCUIT_PATH']
while not os.path.isfile(circuit_path):
    L.warning('circuit config is not found (not uploaded yet / wrong path)')
    L.info('waiting while circuit config will become available')
    time.sleep(60)


from blue_pair.storage import Storage
from blue_pair.utils import NumpyAwareJSONEncoder
from blue_pair.sim_manager import SimManager

L.debug('creating storage instance')
STORAGE = Storage()
L.debug('storage instance has been created')

SIM_MANAGER = SimManager()


class WSHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        L.debug('websocket client has been connected')
        return True

    @tornado.web.asynchronous
    def on_message(self, msg):
        msg = json.loads(msg)
        L.debug('got ws message: %s', msg)
        cmd = msg['cmd']
        cmdid = msg['cmdid']

        if cmd == 'get_circuit_cells':
            cells = STORAGE.get_circuit_cells()
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
                try:
                    cell_chunk = cell_chunks_it.next()
                except StopIteration:
                    cell_chunk = None
                if cell_chunk is not None:
                    self.send_message('circuit_cells_data', cell_chunk.values)
                    tornado.ioloop.IOLoop.current().add_callback(send)

            tornado.ioloop.IOLoop.current().add_callback(send)

        elif cmd == 'get_cell_connectome':
            gid = msg['data']
            connectome = STORAGE.get_connectome(gid)
            connectome['cmdid'] = cmdid

            L.debug('sending cell connectome to the client')
            self.send_message('cell_connectome', connectome)

        elif cmd == 'get_syn_connections':
            gids = msg['data']
            connections = STORAGE.get_syn_connections(gids)
            connections['cmdid'] = cmdid

            L.debug('sending syn connections to the client')
            self.send_message('syn_connections', connections)

        elif cmd == 'get_cell_morphology':
            gids = msg['data']
            cell_nm_morph = STORAGE.get_cell_morphology(gids)
            cell_nm_morph['cmdid'] = cmdid

            L.debug('sending cell morphology to the client')
            self.send_message('cell_morphology', cell_nm_morph)

        elif cmd == 'get_sim_traces':
            simulator_config = msg['data']
            socket = self
            IOLoop = tornado.ioloop.IOLoop.current()
            def send_traces(traces):
                socket.send_message('simulation_result', traces)
            def cb(traces):
                IOLoop.add_callback(send_traces, traces)
            SIM_MANAGER.create_sim(simulator_config, cb)

    def send_message(self, cmd, data=None):
        payload = json.dumps({'cmd': cmd, 'data': data},
                             cls=NumpyAwareJSONEncoder)
        self.write_message(payload)


if __name__ == '__main__':
    app = tornado.web.Application([
        (r'/ws', WSHandler),
    ])
    L.debug('starting tornado io loop')
    app.listen(8000)
    tornado.ioloop.IOLoop.current().start()
