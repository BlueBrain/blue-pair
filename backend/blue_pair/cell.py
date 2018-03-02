
import bglibpy
import numpy as np


class Cell(object):

    def _collect_pt3d(self):
        '''collect the pt3d info, for each section, align soma at center'''
        self._all_sec_array = []
        self._all_sec_map = {}

        self.x = []
        self.y = []
        self.z = []
        self.d = []
        self.arc = []
        for index, sec in enumerate(self.ssim.cells[self.gid].cell.allsec()):

            cell_name = str(self.ssim.cells[self.gid].cell)
            section_name = self._get_section_name(sec)
            if cell_name + '.' not in section_name:
                continue

            self._all_sec_array.append(sec)
            self._all_sec_map[section_name] = {'index': index}

            sec_point_count = int(bglibpy.neuron.h.n3d())

            x_i = np.zeros(sec_point_count)
            y_i = np.zeros(sec_point_count)
            z_i = np.zeros(sec_point_count)
            d_i = np.zeros(sec_point_count)
            arc_i = np.zeros(sec_point_count)

            for i in range(sec_point_count):
                x_i[i] = bglibpy.neuron.h.x3d(i)
                y_i[i] = bglibpy.neuron.h.y3d(i)
                z_i[i] = bglibpy.neuron.h.z3d(i)
                d_i[i] = bglibpy.neuron.h.diam3d(i)
                arc_i[i] = bglibpy.neuron.h.arc3d(i)

            self.x.append(x_i)
            self.y.append(y_i)
            self.z.append(z_i)
            self.d.append(d_i)
            self.arc.append(arc_i)

        self.section_count = index

        #remove offsets which may be present if soma is centred in Origo
        if len(self.x) > 1:
            xoff = self.x[0].mean()
            yoff = self.y[0].mean()
            zoff = self.z[0].mean()
            for i in range(len(self.x)):
                self.x[i] -= xoff
                self.y[i] -= yoff
                self.z[i] -= zoff

    def _collect_sections_geometry(self):
        '''Loop over allseclist to determine area, diam, xyz-start- and
        endpoints, embed geometry to cell object'''

        for sec_idx, sec in enumerate(self._all_sec_array):
            name = self._get_section_name(sec)
            sec_data = self._all_sec_map[name]

            segment_count = sec.nseg
            sec_data['nseg'] = segment_count
            gsen2 = 1.0/2/segment_count

            areavec = np.zeros(segment_count)
            diamvec = np.zeros(segment_count)
            lengthvec = np.zeros(segment_count)

            if len(self.arc[sec_idx]) > 0:
                #normalize as seg.x [0, 1]
                L = self.arc[sec_idx] / sec.L

                #fill in values segx, area, diam, length
                segx = np.zeros(segment_count)
                areavec = np.zeros(segment_count)
                diamvec = np.zeros(segment_count)
                lengthvec = np.zeros(segment_count)
                for i, seg in enumerate(sec):
                    segx[i] = seg.x
                    areavec[i] = bglibpy.neuron.h.area(seg.x)
                    diamvec[i] = seg.diam
                    lengthvec[i] = sec.L/segment_count

                #can't be >0 which may happen due to NEURON->Python float transfer:
                segx0 = (segx - gsen2).round(decimals=6)
                segx1 = (segx + gsen2).round(decimals=6)

                #fill vectors with interpolated coordinates of start and end points
                sec_data['xstart']  = np.interp(segx0, L, self.x[sec_idx])
                sec_data['xend']    = np.interp(segx1, L, self.x[sec_idx])
                sec_data['xcenter'] = (sec_data['xstart'] + sec_data['xend']) / 2.0
                sec_data['xdirection'] = sec_data['xend'] - sec_data['xstart']

                sec_data['ystart'] = np.interp(segx0, L, self.y[sec_idx])
                sec_data['yend']   = np.interp(segx1, L, self.y[sec_idx])
                sec_data['ycenter'] = (sec_data['ystart'] + sec_data['yend']) / 2.0
                sec_data['ydirection'] = sec_data['yend'] - sec_data['ystart']

                sec_data['zstart'] = np.interp(segx0, L, self.z[sec_idx])
                sec_data['zend']   = np.interp(segx1, L, self.z[sec_idx])
                sec_data['zcenter'] = (sec_data['zstart'] + sec_data['zend']) / 2.0
                sec_data['zdirection'] = sec_data['zend'] - sec_data['zstart']

                sec_data['segx'] = segx
                sec_data['area'] = areavec
                sec_data['diam'] = diamvec
                sec_data['length'] = lengthvec
                sec_data['distance'] = np.sqrt(sec_data['xdirection'] * sec_data['xdirection'] +
                                               sec_data['ydirection'] * sec_data['ydirection'] +
                                               sec_data['zdirection'] * sec_data['zdirection'])

    def _dendro_sec(self, sec, data):
        data['name'] = self._get_section_name(sec)
        data['height'] = sec.L + sec.nseg * PADDING

        segments = []
        data['segments'] = segments

        max_seg_diam = 0
        for i, seg in enumerate(sec):
            if seg.diam > max_seg_diam:
                max_seg_diam = seg.diam
            segments.append({'length': sec.L/sec.nseg, 'diam': seg.diam})
        data['width'] = max_seg_diam + PADDING * 2

        data['sections'] = []
        for child_sec in sec.children():
            child_sec_data = {}
            data['sections'].append(child_sec_data)
            self._dendro_sec(child_sec, child_sec_data)

        if len(data['sections']) == 0:
            total_width = data['width']
        else:
            total_width = 0

        for s in data['sections']:
            total_width += s['total_width']
        data['total_width'] = total_width

        return data

    def _collect_dendrogram(self):
        self._dendrogram = self._dendro_sec(self.cell.soma[0], {})

    def _topology_children(self, sec, topology):
        children = topology['children']
        level = topology['level']
        for child_sec in sec.children():
            child_topology = {'id': self._get_section_name(child_sec),
                              'children': [],
                              'level': level + 1,
                              }
            children.append(child_topology)
            self._topology_children(child_sec, child_topology)
        return topology

    def _get_section_name(self, sec):
        return sec.name()

    def __init__(self, ssim, gid):
        self.gid = gid
        self.ssim = ssim
        bglibpy.neuron.h.define_shape()
        self._collect_pt3d()
        self._collect_sections_geometry()

    def get_cell_morph(self):
        return self._all_sec_map
