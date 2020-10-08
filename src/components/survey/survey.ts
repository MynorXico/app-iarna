import { Component, Input } from '@angular/core';

import * as Survey from 'survey-angular';
import {Peticion} from '../../models/peticion.model';
import  FileManager from '../../files/file_management';
import {Database} from '../../db/database';


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
        Survey.Survey.cssType = "bootstrap";
        Survey.defaultBootstrapCss.navigationButton = "btn btn-green";

        this._survey = surveyAndMode['survey'];
        this._mode = surveyAndMode['mode'];
        
        let surveyModel
        if(surveyAndMode['mode']){
            alert('entre en el online papaito')
            surveyModel = new Survey.ReactSurveyModel({ surveyId: this._survey.Id });
            this.renderSurvey(surveyModel);
        }else{
            FileManager.getQuestions(this._survey.Id).then( surveyFromStorage => {
                surveyModel = new Survey.ReactSurveyModel(surveyFromStorage);
                this.renderSurvey(surveyModel);
            });
        }
    }

    renderSurvey(surveyModel){
        // Change language.
        surveyModel.locale = "es";
        // Progress Bar.
        surveyModel.showProgressBar = 'bottom';

        //FileManager.saveQuestions(surveyModel['propertyHash']['surveyId'], surveyModel, 'Encuestas');
        surveyModel.onComplete.add(this.sendDataToServer.bind(this));
        Survey.SurveyNG.render('surveyElement', { model: surveyModel });
    }

    constructor(private db:Database) {
    }

    ionViewDidLoad() {
    }

    async sendDataToServer(survey) {
        //console.log("sendDataToServer");
        //console.log("postId", this._survey.PostId);
        if(this._mode){
            survey.sendResult(this._survey.PostId);
        }else{
            // Verificar si existe el directorio
            const respuestas    = survey.valuesHash;
            const id_encuesta   = this._survey.Id;
            const id_encuesta_respondida = this._survey.PostId;
            let content = {};
            content['respuestas'] = respuestas;
            content['postId'] = id_encuesta_respondida;
            
            await FileManager.createAnswersDirectoryIfDoesntExists(id_encuesta, 'Respuestas/')
            .then ((res)=> {
                if(res){
                    FileManager.getFileName('Respuesta_1','Respuestas/'+id_encuesta+'/')
                    .then ((filename)=>{
                        FileManager.writeFile(filename, JSON.stringify(content), 'Respuestas/'+id_encuesta)
                        .then(()=> {
                            /* Insertar el archivo en BDD */
                            const item:Peticion = {id: 1, estado: 0, path: 'Respuestas/'+id_encuesta+'/'+filename};
                            this.db.insertRow(item).then (()=>{
                                console.log("Saved on database");
                            });      
                        })
        
                        console.log("Sending data: ", survey.valuesHash)
                    })
                }
                else{
                    alert("Ocurrio un error y no se pudo almacenar la respuesta.");
                }
                
            })
        }
    };


}