
import os
import bluepy


circuit = bluepy.Circuit(os.getenv('CIRCUIT_PATH'))
morphology_list = circuit.v2.cells.get()['morphology'].unique().tolist()

morph_files = []

for m in morphology_list:
  morph_files.append("ascii/%s.asc" % m)
  morph_files.append("v1/%s.h5" % m)

morph_files.sort()

with open("circuit-morphology-list.txt", 'w') as file:
    file.write('\n'.join(morph_files))

print('circuit-morphology-list.txt has been generated in /tmp')
