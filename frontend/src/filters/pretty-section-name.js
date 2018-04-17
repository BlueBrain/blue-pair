
function prettySectionName(sectionName) {
  if (!sectionName) return '';

  return sectionName.replace('_bglibpy', '');
}

export default prettySectionName;
