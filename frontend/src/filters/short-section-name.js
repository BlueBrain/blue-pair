
import constants from './../constants';

export default function shortSectionName(longSectionName) {
  return longSectionName.match(constants.shortSectionNameRegex)[1];
}
