
const shortSectionNameRegex = /\.(.*)/;

export default function shortSectionName(longSectionName) {
  return longSectionName.match(shortSectionNameRegex)[1];
}
