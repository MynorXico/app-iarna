import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController, ItemSliding } from 'ionic-angular';

import { SurveyProvider } from '../../providers/survey/survey';
import { SurveyDetailsPage } from '../survey-details/survey-details';

import { SurveyModel } from "../../models/survey.model";

import { ApiWrapper } from '../../providers/survey/api-wrapper';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { Database } from '../../db/database';
import { Peticion } from '../../models/peticion.model';


import  FileManager from '../../files/file_management';
import * as Survey from 'survey-angular';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    
    surveys: SurveyModel[];
    archiveSurveys: SurveyModel[];
    defaultImages: any;
    noSurveys: boolean = false;
    currentYear = new Date().getFullYear();
    textoModo: string;
    modo: boolean;
    peticiones: Peticion[]

    constructor(public navCtrl: NavController, public surveyProvider: SurveyProvider,
                public loadingCtrl: LoadingController, public alertCtrl: AlertController, public apiWrapper: ApiWrapper,
                private db: Database) {
        //this.getActiveSurveys();
        //this.getArchiveSurveys();
        this.getSurveys();
                
        this.textoModo='Offline';
        this.modo = false;
        // TO TEST API WRAPPER UNCOMMENT THIS CODE. 
        /*
        this.apiWrapper.api.surveys.get('getActive', { accessKey: true, ownerId: true }).subscribe(
            data => {
                console.log(data);
            },
            error => {
                console.log(<any>error);
            }
        );
        */
 
    }


    cambioModo() {
        this.textoModo = this.modo?'Online':'Offline';
    }

    /*
        Este metodo obtiene data para pruebas
    */
    ejemploObtenerData(){
        this.peticiones = []
        this.db.getRows().then((res) => {
            if (res.rows.length > 0) {
                for (var i = 0; i < res.rows.length; i++) {
                    this.peticiones.push({
                        id: res.rows.item(i).id,
                        estado: res.rows.item(i).estado,
                        path: res.rows.item(i).path
                    });
                }
            }

            this.peticiones.forEach(item => {
                alert(item.path)
            })
        })
        .catch(e => {
            alert("error " + JSON.stringify(e))
        });
    }

    getSurveys() {
        let loading = this.loadingCtrl.create({
            content: "Cargando encuestas..."
        });
        loading.present();
        Observable.forkJoin(this.surveyProvider.getActiveSurveys(), this.surveyProvider.getArchiveSurveys())
            .subscribe(async data => {
                // console.log(data);
                this.surveys = SurveyModel.fromJSONArray(data[0]);

                // Guardar estas encuestas
                console.log("Got surveys: ", this.surveys);
                await FileManager.createDirectoryIfDoesntExist('Encuestas');
                this.surveys.forEach((value, index)=> {
                    let survey_id = value.Id;
                    FileManager.writeFile(survey_id, JSON.stringify(value), 'Encuestas');
                })
                //console.log(this.surveys);
                //this.archiveSurveys = SurveyModel.fromJSONArray(data[1]);
                loading.dismiss();
            },
            error => {
                console.log(<any>error);
                if ((error.message == "Failed to get surveys.") || (error.message == "Http failure response for (unknown url): 0 Unknown Error")) this.noSurveys = true;
                loading.dismiss();
            });
    }

    downloadSurveys(surveys){
        console.log(surveys);
        surveys.forEach(survey => {
            let surveyModel = new Survey.ReactSurveyModel({ surveyId: survey.Id });
            console.log('SurveyModel', surveyModel);
            FileManager.writeFile(surveyModel['propertyHash']['surveyId'], '{}', 'Encuestas').then(res => {
                FileManager.saveQuestions(surveyModel['propertyHash']['surveyId'], surveyModel, 'Encuestas');
            }, err =>{
                console.log('error esperando escritura')
            })
            
        });
    }

    getActiveSurveys() {
        let loading = this.loadingCtrl.create({
            content: "Cargando encuestas..."
        });

        loading.present();

        this.surveyProvider.getActiveSurveys()
            .subscribe(
                data => {
                    //console.log(data);
                    //this.surveys = data;
                    this.surveys = SurveyModel.fromJSONArray(data);
                    loading.dismiss();
                },
                error => {
                    console.log(<any>error);
                    if ((error.message == "Failed to get surveys.") || (error.message == "Http failure response for (unknown url): 0 Unknown Error")) this.noSurveys = true;
                    loading.dismiss();
            }
        );
    }

    // getArchiveSurveys() {
    //     this.surveyProvider.getArchiveSurveys()
    //         .subscribe(
    //             data => {
    //                 //console.log(data);
    //                 this.archiveSurveys = SurveyModel.fromJSONArray(data);
    //             },
    //             error => {
    //                 console.log(<any>error);
    //                 if ((error.message == "Failed to get surveys.") || (error.message == "Http failure response for (unknown url): 0 Unknown Error")) this.noSurveys = true;
    //         }
    //     );
    // }

    selectedSurvey(survey) {
        console.log('Mode', this.modo);
        this.navCtrl.push(SurveyDetailsPage, {
            survey: survey,
            mode: this.modo
        });
    }

    presentAlert({
        survey = null,
        operation = '', 
      } = {}) {
        let options = this.alertConfig(operation);
        let alert = this.alertCtrl.create({
          title: options.title,
          subTitle: options.subTitle,
          buttons: [
            {
                text: 'Cancel',
                handler: () => {
                }
            },
            {
              text: 'Accept',
              handler: () => {
                if (operation == 'delete') this.deleteSurvey(survey);
                if (operation == 'activate') this.activateSurvey(survey);
                //if (operation == 'archive') this.archiveSurvey(survey);
                if (operation == "create") this.createSurvey("New Survey :)");
              }
            }
          ]
        });
        alert.present();
    }

    showPrompt(survey, slidingItem: ItemSliding) {
        let prompt = this.alertCtrl.create({
          title: 'Actualizar clave de acceso para cargar encuestas',
          message: "Ingrese la nueva clave de acceso",
          inputs: [
            {
              name: 'name',
              //placeholder: 'Name'
            },
          ],
          buttons: [
            {
              text: 'Cancelar',
              handler: data => {
                //console.log('Cancel clicked');
              }
            },
            {
              text: 'Aceptar',
              handler: data => {
                //console.log('Accept clicked');
                //console.log(data);
                //this.changeSurveyName(survey, data.name, slidingItem);
                //this.surveyProvider.NewKey=data.name;
                localStorage.setItem("newKey", data.name);
                location.reload(); 
                
              }
            }
          ]
        });
        prompt.present();
    }

    showPrompt1(survey, slidingItem: ItemSliding) {
        let prompt = this.alertCtrl.create({
          title: '<div align="center"> Creditos </div>' ,
          message: "<b> Edgar Pimentel </b> <br>" + "<b> Jose del Pozo </b> <br>" + "<b> Alberto Estrada </b> <br>" + "<b> Luis Pedro Gonzalez </b> <br>" + "<b> Oscar Gomez </b> <br>" + "<b> Miguel Rojas </b> <br>",
          
          buttons: [
            
            {
              text: 'Aceptar',
              
            }
          ]
        });
        prompt.present();
    }

    createSurvey(name) {
        let loading = this.loadingCtrl.create({
            content: "Creating Survey..."
        });

        loading.present();

        this.surveyProvider.createSurvey(name)
        .subscribe(
            data => {
                //console.log(data);
                let survey: SurveyModel = new SurveyModel(data);
                this.surveys.unshift(survey);
                loading.dismiss();
            },
            error => {
                console.log(<any>error);
                loading.dismiss();
            }
        );
    }


    deleteSurvey(survey) {
        let loading = this.loadingCtrl.create({
            content: "Deleting Survey..."
        });

        loading.present();

        this.surveyProvider.deleteSurvey(survey.Id)
        .subscribe(
            data => {
                console.log(data);
                loading.dismiss();
            },
            error => {
                console.log(<any>error);
                if (error.status == 200) {
                    if ( survey.IsArchived === false) this.surveys = this.removeElement(survey.Id, this.surveys);
                    //else this.archiveSurveys = this.removeElement(survey.Id, this.archiveSurveys);
                }
                loading.dismiss();
            }
        );
    }

    changeSurveyName(survey, newName, slidingItem) {
        let loading = this.loadingCtrl.create({
            content: "Updating Survey name..."
        });

        loading.present();

        this.surveyProvider.changeSurveyName(survey.Id, newName)
        .subscribe(
            data => {
                console.log(data);
                slidingItem.close();
                loading.dismiss();
            },
            error => {
                console.log(<any>error);
                if (error.status == 200)  {
                    survey.Name = newName;
                    slidingItem.close();
                }
                loading.dismiss();
            }
        );
    }

    activateSurvey(survey) {
        let loading = this.loadingCtrl.create({
            content: "Activating Survey..."
        });

        loading.present();

        this.surveyProvider.restoreSurvey(survey.Id)
        .subscribe(
            data => {
                console.log(data);
                loading.dismiss();
            },
            error => {
                console.log(<any>error);
                if (error.status == 200) {
                    this.surveys.push(survey);
                    this.archiveSurveys = this.removeElement(survey.Id, this.archiveSurveys);
                }
                loading.dismiss();
            }
        );
    }

    // archiveSurvey(survey) {
    //     let loading = this.loadingCtrl.create({
    //         content: "Archiving Survey..."
    //     });

    //     loading.present();

    //     this.surveyProvider.archiveSurvey(survey.Id)
    //     .subscribe(
    //         data => {
    //             console.log(data);
    //             loading.dismiss();
    //         },
    //         error => {
    //             console.log(<any>error);
    //             if (error.status == 200) {
    //                 this.archiveSurveys.push(survey);
    //                 this.surveys = this.removeElement(survey.Id, this.surveys);
    //             }
    //             loading.dismiss();
    //         }
    //     );
    // }

    removeElement(surveyId, surveys) {
        return surveys.filter(function(e) {
            return e.Id !== surveyId;
        });
    }

    alertConfig(operation) {
        let options = {
            delete: {title: 'Delete Survey', subTitle: '¿Are you sure to delete the survey?'},
            activate: {title: 'Activate Survey', subTitle: '¿Are you sure to activate the survey?'},
            archive: {title: 'Archive Survey', subTitle: '¿Are you sure to archive the survey?'},
            create: {title: 'Create Survey', subTitle: '¿Are you sure to create new survey?'}

        }
        return options[operation];
    }

   

}
