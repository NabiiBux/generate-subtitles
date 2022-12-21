const translateText = require('./libreTranslateWrapper');
const fs = require('fs-extra');
const { languagesToTranscribe, translationLanguages } = require('../constants/constants');;
const { stripOutTextAndTimestamps, reformatVtt } = require('./helpers')

const convert = require("cyrillic-to-latin");

let l = console.log;

if(global.debug === 'false'){
  l = function(){}
}

// l('translationLanguages')
// l(translationLanguages);
//
// l('languagesToTranscribe')
// l(languagesToTranscribe);

function getCodeFromLanguageName(languageName){
  return translationLanguages.find(function(filteredLanguage){
    return languageName === filteredLanguage.name;
  }).code
}

// l(getCodeFromLanguageName('English'))

/** for translation **/
async function createTranslatedFiles({
    directoryAndFileName,
    language,
    websocketConnection
}){

  const loopThrough = ['.srt', '.vtt', 'txt'];

  const vttPath = `${directoryAndFileName}.vtt`;

  // TODO: translate the rest
  const vttData = await fs.readFile(vttPath, 'utf-8');
  l('vttData');
  l(vttData);

  // copy original as copied
  await fs.copy(vttPath, `${directoryAndFileName}_${language}.vtt`)

  const { strippedText, timestampsArray } = await stripOutTextAndTimestamps(vttPath)

  for(const languageToConvertTo of languagesToTranscribe){
    l('languageToConvertTo');
    l(languageToConvertTo);

    l('language');
    l(language);

    try {
      // no need to translate just copy the file
      if(languageToConvertTo !== language){
        websocketConnection.send(JSON.stringify({
          languageUpdate: `Translating into ${languageToConvertTo}..`,
          message: 'languageUpdate'
        }), function () {});


        const sourceLanguageCode = getCodeFromLanguageName(language);
        const targetLanguageCode = getCodeFromLanguageName(languageToConvertTo);

        // l('sourceLanguageCode');
        // l(sourceLanguageCode);
        // l('targetLanguageCode');
        // l(targetLanguageCode);

        // hit LibreTranslate backend
        l(`hitting libretranslate: ${language} -> ${languageToConvertTo}`);
        // TODO: to convert to thing
        let translatedText = await translateText({
          sourceLanguage: sourceLanguageCode, // before these were like 'EN', will full language work?
          targetLanguage: targetLanguageCode,
          text: strippedText,
        })

        // l('translatedText');
        // l(translatedText);

        if(!translatedText){
          continue
        }

        const reformattedVtt = reformatVtt(timestampsArray, translatedText);

        await fs.writeFile(`${directoryAndFileName}_${languageToConvertTo}.vtt`, reformattedVtt, 'utf-8');
      }
    } catch (err){
      l(err);
      l('error in translation');
      return err
    }
  }
}

// const uploadDirectoryName = 'ef56767d5cba0ae421a9f6f570443205';
// const transcribedFileName = 'ef56767d5cba0ae421a9f6f570443205';
//
// const languageToConvertFrom = 'en';
// const languagesToConvertTo = ['es', 'fr'];

// async function main(){
//   const completed = await createTranslatedSrts({
//     uploadDirectoryName: uploadDirectoryName,
//     transcribedFileName: transcribedFileName,
//     languageToConvertFrom: languageToConvertFrom,
//     languagesToConvertTo: languagesToConvertTo
//   });
//
//   l('completed');
//   l(completed);
// }

// main();

module.exports = createTranslatedFiles;

