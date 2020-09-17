import { Component, Input } from '@angular/core';

import * as Survey from 'survey-angular';

import  FileManager from '../../files/file_management';



/**
 * Generated class for the SurveyComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'survey',
    templateUrl: 'survey.html'
})
export class SurveyComponent {

    _survey: any;
    _mode: any;

    @Input() set survey(surveyAndMode) {
        console.log('Survey',surveyAndMode);
        Survey.Survey.cssType = "bootstrap";
        Survey.defaultBootstrapCss.navigationButton = "btn btn-green";

        this._survey = surveyAndMode['survey'];
        this._mode = surveyAndMode['mode'];
        
        let surveyModel
        if(surveyAndMode['mode']){
            surveyModel = new Survey.ReactSurveyModel({ surveyId: this._survey.Id });
        }else{
            let surveyFromStorage = FileManager.getQuestions(this._survey.id);
            surveyModel = new Survey.ReactSurveyModel(surveyFromStorage);
        }
        // Change language.
        surveyModel.locale = "es";
        // Progress Bar.
        surveyModel.showProgressBar = 'bottom';

        FileManager.saveQuestions(surveyModel['propertyHash']['surveyId'], surveyModel, 'Encuestas');
        surveyModel.onComplete.add(this.sendDataToServer.bind(this));
        Survey.SurveyNG.render('surveyElement', { model: surveyModel });
    }

    constructor() {
    }

    ionViewDidLoad() {
    }

    async sendDataToServer(survey) {
        //console.log("sendDataToServer");
        //console.log("postId", this._survey.PostId);
        if(this._mode){
            survey.sendResult(this._survey.PostId);
        }
        // Verificar si existe el directorio
        const respuestas    = survey.valuesHash;
        const id_encuesta   = survey.propertyHash.surveyId;
        const id_encuesta_respondida = this._survey.PostId;
        await FileManager.createDirectoryIfDoesntExist('Respuestas');
        await FileManager.createDirectoryIfDoesntExist(id_encuesta, 'Respuestas/')
        await FileManager.writeFile(id_encuesta_respondida, JSON.stringify(respuestas), 'Respuestas/'+id_encuesta)
        console.log("Sending data: ", survey.valuesHash)
    };


}
