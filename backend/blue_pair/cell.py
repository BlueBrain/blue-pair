
import bglibpy
import numpy as np


class Cell(object):

    def _collect_pt3d(self):
        '''collect the pt3d info, for each section, align soma at center'''
        self.cell_morph = {}

        for index, sec in enumerate(self.ssim.cells[self.gid].cell.allsec()):
            cell_name = str(self.ssim.cells[self.gid].cell)
            section_name = self._get_section_name(sec)
            if cell_name + '.' not in section_name:
                continue

            self.cell_morph[section_name] = {
                'x': [],
                'y': [],
                'z': [],
                'd': []
            }

            sec_point_count = int(bglibpy.neuron.h.n3d())

            for i in range(sec_point_count):
                self.cell_morph[section_name]['x'].append(bglibpy.neuron.h.x3d(i))
                self.cell_morph[section_name]['y'].append(bglibpy.neuron.h.y3d(i))
                self.cell_morph[section_name]['z'].append(bglibpy.neuron.h.z3d(i))
                self.cell_morph[section_name]['d'].append(bglibpy.neuron.h.diam3d(i))

    def _get_section_name(self, sec):
        return sec.name()

    def __init__(self, ssim, gid):
        self.gid = gid
        self.ssim = ssim
        bglibpy.neuron.h.define_shape()
        self._collect_pt3d()

    def get_cell_morph(self):
        return self.cell_morph
