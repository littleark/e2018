const sentencesToBeCleanedUp = [
  ' - Il Fatto Quotidiano',
  ' - Il Post',
  ' \\| VIDEO',
  ' - Secolo d\'Italia',
  ' \\| Sky TG24',
  ' \\| LaPresse',
  ' - La Nazione',
  ' \\(FOTO, DOCUMENTO\\)',
  ' - QuotidianoNet'
];

export const cleanUp = (sentence) => {
  let cleanSentence = sentence;
  sentencesToBeCleanedUp.forEach(cleanUpString => {
    const re = new RegExp(cleanUpString,'g');
    cleanSentence = cleanSentence.replace(re,'');
  })
  return cleanSentence;
}
