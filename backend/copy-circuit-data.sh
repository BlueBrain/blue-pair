#!/usr/bin/env bash


# Script to copy circuit data into openShift pod preserving file and folder structure.
# Storage capable to fit circuit data should be mounted according to circuit path.
#
# Arguments:
# * full path to a circuit config
# * openShift target pod
#
# Note: you should have openShift CLI available in your PATH,
# and it should be logged in within oc cluster.
#
# Example:
# ./copy-circuit-data.sh \
#   /gpfs/bbp.cscs.ch/project/proj64/circuits/O1.v6a/20171212/CircuitConfig \
#   blue-pair-svc-16-kv4db


export RSYNC_RSH='oc rsh'


circuit_config="$1"
target_pod="$2"

circuit_path=$(       cat $circuit_config | grep CircuitPath     | grep -oEi '[\S+\ ](\S*)$' | xargs)
nrn_path=$(           cat $circuit_config | grep nrnPath         | grep -oEi '[\S+\ ](\S*)$' | xargs)
morphology_path=$(    cat $circuit_config | grep MorphologyPath  | grep -oEi '[\S+\ ](\S*)$' | xargs)
me_type_path=$(       cat $circuit_config | grep METypePath      | grep -oEi '[\S+\ ](\S*)$' | xargs)
cell_lib_file=$(      cat $circuit_config | grep CellLibraryFile | grep -oEi '[\S+\ ](\S*)$' | xargs)
me_combo_info_file=$( cat $circuit_config | grep MEComboInfoFile | grep -oEi '[\S+\ ](\S*)$' | xargs)
target_file=$(        cat $circuit_config | grep TargetFile      | grep -oEi '[\S+\ ](\S*)$' | xargs)


echo
echo '########################################################################################'
echo '### Circuit config:' $circuit_config
echo '### Dest pod:' $target_pod

echo
echo '########################################################################################'
echo '### Start sync'

echo
echo '########################################################################################'
echo '### Create circuit folder'
echo '### Path:' "$target_pod:$circuit_path"
oc rsh "$target_pod" mkdir -p "$circuit_path"
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync circuit config'
echo '### Source:' "$circuit_config"
echo '### Destination:' "$target_pod:$circuit_config"
rsync \
    -Lh \
    --progress \
    --ignore-existing \
    "$circuit_config" "$target_pod:$circuit_config"
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync CellLibraryFile'
echo '### Source:' "$circuit_path/$cell_lib_file"
echo '### Destination:' "$target_pod:$circuit_path/$cell_lib_file"
rsync \
    -Lh \
    --progress \
    --ignore-existing \
    "$circuit_path/$cell_lib_file" "$target_pod:$circuit_path/$cell_lib_file"
echo '### Done'

echo
echo '########################################################################################'
echo '### Create folder for MEComboInfoFile'
echo '### Path:' "$target_pod:$(dirname "$me_combo_info_file")"
oc rsh "$target_pod" mkdir -p "$(dirname $me_combo_info_file)"
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync MEComboInfoFile'
echo '### Source:' "$me_combo_info_file"
echo '### Destination:' "$target_pod:$me_combo_info_file"
rsync \
    -Lh \
    --progress \
    --ignore-existing \
    "$me_combo_info_file" "$target_pod:$me_combo_info_file"
echo '### Done'

echo
echo '########################################################################################'
echo '### Create nrnPath folder'
echo '### Path:' "$target_pod:$nrn_path"
oc rsh $target_pod mkdir -p "$nrn_path"
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync nrnPath/nrn.h5'
echo '### Source:' "$nrn_path"/nrn.h5
echo '### Destination:' "$target_pod:$nrn_path"/nrn.h5
rsync \
    -Lh \
    --progress \
    --ignore-existing \
    "$nrn_path"/nrn.h5 "$target_pod:$nrn_path"/nrn.h5
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync nrnPath/start.target'
echo '### Source:' "$nrn_path"/start.target
echo '### Destination:' "$target_pod:$nrn_path"/start.target
rsync \
    -Lh \
    --progress \
    --ignore-existing \
    "$nrn_path"/start.target "$target_pod:$nrn_path"/start.target
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync nrnPath/nrn_summary.h5'
echo '### Source:' "$nrn_path"/nrn_summary.h5
echo '### Destination:' "$target_pod:$nrn_path"/nrn_summary.h5
rsync \
    -Lh \
    --progress \
    --ignore-existing \
    "$nrn_path"/nrn_summary.h5 "$target_pod:$nrn_path"/nrn_summary.h5
echo '### Done'

echo
echo '########################################################################################'
echo '### Create MorphologyPath folder'
echo '### Path:' "$target_pod:$morphology_path"
oc rsh $target_pod mkdir -p "$morphology_path"
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync MorphologyPath/ascii'
echo '### Source:' "$morphology_path"/ascii
echo '### Destination:' "$target_pod:$morphology_path"
rsync \
    -rLkhz \
    --ignore-existing \
    --blocking-io \
    --progress \
    "$morphology_path"/ascii "$target_pod:$morphology_path"
echo '### Done'

echo
echo '########################################################################################'
echo '### Create METypePath folder'
echo '### Path:' "$target_pod:$me_type_path"
oc rsh $target_pod mkdir -p "$me_type_path"
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync METypePath'
echo '### Source:' "$me_type_path"
echo '### Destination:' "$target_pod:$me_type_path/.."
rsync \
    -rLh \
    --progress \
    --ignore-existing \
    "$me_type_path" "$target_pod:$me_type_path/.."
echo '### Done'

echo
echo '########################################################################################'
echo '### Sync finished'
