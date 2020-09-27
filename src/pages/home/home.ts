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
import { HttpClient } from '@angular/common/http';


import  FileManager from '../../files/file_management';

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
    respuestasPendientes: number;
    modo: boolean;
    peticiones: Peticion[]

    constructor(public navCtrl: NavController, public surveyProvider: SurveyProvider,
                public loadingCtrl: LoadingController, public alertCtrl: AlertController, public apiWrapper: ApiWrapper,
                private db: Database, private http: HttpClient) {
        //this.getActiveSurveys();
        //this.getArchiveSurveys();
        this.modo = true;
        this.cambioModo();
        this.getSurveys();

        this.respuestasPendientes = 0;
            
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

    ionViewWillEnter (){
        this.obtenerDatosRespuestas();
    }

    cambioModo() {
        this.textoModo = this.modo?'Online':'Offline';
    }

    obtenerDatosRespuestas(){
        this.db.getRows().then(
            (data)=>{
                this.respuestasPendientes = data.rows.length;
            }
        ).catch((error)=>{
            alert("Error: "+JSON.stringify(error));
        })

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
        if(this.modo){
            Observable.forkJoin(this.surveyProvider.getActiveSurveys(), this.surveyProvider.getArchiveSurveys())
            .subscribe(async data => {
                console.log('SurveyData', data);
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
        }else{
            FileManager.getSurveys().then((surveysFromFileSystem) => {
                if(surveysFromFileSystem.length > 0){
                    this.surveys = SurveyModel.fromJSONArray(surveysFromFileSystem);
                }else{
                    this.noSurveys = true;
                }
                loading.dismiss();
            });
        }
    }

    downloadSurveys(surveys){
        let loading = this.loadingCtrl.create({
            content: "Descargando encuestas..."
        });
        loading.present();
        console.log(surveys);
        surveys.forEach(survey => {
            this.http.get('https://dxsurveyapi.azurewebsites.net/api/Survey/getSurvey?surveyId=' + survey.Id).subscribe((response) => {
                console.log('Questions', JSON.stringify(response));
                FileManager.saveQuestions(survey.Id, JSON.stringify(response), 'Encuestas');
            });            
        });
        loading.dismiss();
    }

    uploadSurveys(){
        let loading = this.loadingCtrl.create({
            content: "Subiendo respuestas..."
        });
        loading.present();
        
        this.UpdateDBFiles()
        .then(()=>{
            this.db.deleteRows()
            .then(()=>{
                loading.dismiss();
                this.db.getRows().then(
                    (data)=>{
                        let pendientes = data.rows.length;
                        if(data.rows.length > 0){
                            alert("Quedaron pendientes " + pendientes + " respuestas de sincronizar. Espere unos minutos y vuelva a sincronizar respuestas.")
                        }
                    }
                ).catch((error)=>{
                    alert("Error: "+JSON.stringify(error));
                })
        
                
            })
            .catch(()=>{
                loading.dismiss();
            });
        })
        .catch(()=>{
            loading.dismiss();
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

    async UpdateDBFiles(){
        let resultado = true;

        await this.db.getRows()
        .then( data => {
            if(data.rows.length > 0){
                for(let i = 0; i < data.rows.length; i++){
                    let element = data.rows.item(i);

                    let item:Peticion = {id: element.id, estado: 1, path: element.path};
                    this.db.updateRow(item)
                    .then((res)=>{
                        FileManager.getAnswer(element.path.toString())
                        .then(
                            answer => {
                                if(answer.exists){
                                    let content = JSON.parse(answer.content);
                                    let postData = {
                                        "postId": content.postId,
                                        "surveyResult": JSON.stringify(content.respuestas),
                                    }
      
                                    this.http.post('https://dxsurveyapi.azurewebsites.net/api/Survey/post/', postData, {responseType:'text'}).subscribe(
                                            (res) => {
                                                FileManager.deleteFile(element.path.toString())
                                                .then((r)=>{
                                                    if(r){
                                                        item.estado = 2;
                                                        this.db.updateRow(item)
                                                        .then((r)=>{
                                                            this.obtenerDatosRespuestas();
                                                        })
                                                        .catch((e)=>{
                                                            console.log('Error ', JSON.stringify(e))
                                                        })
                                                    }else{
                                                        console.log('No fue posible eliminar el archivo.')
                                                    }
                                                })
                                                .catch((e)=>{
                                                    console.log('Error ', JSON.stringify(e))
                                                })    
                                            },
                                            (err) => {
                                                resultado = false;
                                                item.estado = 0;
                                                this.db.updateRow(item)
                                                .then((r)=> console.log("Se regreso estado a 0, porque no se pudo sincronizar respuesta: " + item.path, JSON.stringify(err)))
                                                .catch((e)=> console.log('Error ', JSON.stringify(e)));
                                            }
                                    );
                                    
                                }else{
                                    this.db.deleteRow(element.id)
                                    .then( () => {
                                        alert("No existe el archivo: " + element.path)
                                    });
                                }                      
                            }
                        )
                        .catch(
                            error => {
                                console.log(error);
                                resultado = false;
                            }
                        );
                    })
                    .catch((error)=>{
                        console.log("No fue posible actualizar registro ", JSON.stringify(element), JSON.stringify(error));
                        resultado = false;
                    })
                }
            }
            else{
                alert("No existen respuestas pendientes de sincronizar"); 
                resultado = false;
            }
        })
        .catch(
            err => {
                console.log('Error: ' + err.message);
                resultado = false;
            }
        );

        return resultado;
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
