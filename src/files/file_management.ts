import { File } from "@ionic-native/file";

export default class FileManager {

    constructor() {
    }

    static getFileManager() {
    }

    /*
        Verifica si existe un directorio en la ruta path/dirName
        path debe finalizar con slash /
    */
    static async directoryExists(dirName, path = "") {
        const file = new File();

        let dir_exists = false;
        await file.checkDir(file.dataDirectory + path, dirName)
            .then(_ => {
                dir_exists = true;
                console.log("Directory exists: " + file.dataDirectory + path + dirName);
            })
            .catch(err => {
                console.log("Error directory not found: ", + file.dataDirectory + path + dirName,  err);
                dir_exists = false;
            })
        return dir_exists;
    }


    static async saveQuestions(filename, current_questions, path =""){
        let current_content = await this.readFile(path, filename);
        let new_content = JSON.parse(current_content);
        new_content['questions'] = current_questions;
        this.writeFile(filename, JSON.stringify(new_content), path);
    }

    /*
        Crea un archivo en la ruta path/filename y le escribe content
    */
    static async writeFile(filename, content, path = "") {
        console.log({
            filename,
            content,
            path
        });
        const file = new File();
        let file_written = false;

        await file.writeFile(file.dataDirectory + path, filename, content, {
            replace: true
        })
            .then(_ => {
                file_written = true;
                console.log("File " + file.dataDirectory + path + "/" + filename + " was written");
            })
            .catch(err => {
                console.log("Failed at writing "+file.dataDirectory + path + "/" + filename, err)
                file_written = false;
            });
        console.log("File content: "+await this.readFile(path, filename));
        return file_written;
    }

    static async getQuestions(surveyId){
        let current_content = await this.readFile('Encuestas', surveyId);
        return JSON.parse(current_content).questions;
    }

    static async getSurveys(){
        let surveys = new Array();
        if(this.directoryExists('Encuestas')){
            const file = new File();
            try{
                let files = await file.listDir(file.dataDirectory, 'Encuestas');
                console.log(files);
                for(const file of files){
                    if(file.isFile){
                        let survey = JSON.parse(await this.readFile('Encuestas', file.name));
                        surveys.push(survey);
                    }
                };
            }catch(err){
                console.log(err);
            }
        }
        return surveys;
    }

    static async getAnswers(){
        let finalAnswers = new Array();
        if(this.directoryExists('Respuestas')){
            const file = new File();
            try{
                let surveys = await file.listDir(file.dataDirectory, 'Respuestas');
                console.log('Survey', surveys);
                for(const survey of surveys){
                    if(survey.isDirectory){
                        console.log(file.dataDirectory + 'Respuestas')
                        let answers = await file.listDir(file.dataDirectory, 'Respuestas/' + survey.name);
                        console.log('Answers', answers);
                        for(const answer of answers){
                            if(answer.isFile){
                                let answerFromFile = JSON.parse(await this.readFile('Respuestas/' + survey.name, answer.name));
                                finalAnswers.push(answerFromFile);
                            }
                        };
                    }
                };
            }catch(err){
                console.log(err);
            }
        }
        return finalAnswers;
    }

    /*
        Devuelve el contenido del archivo path/file
    */
   static async readFile(path, filename){
       const file = new File();
       let content = null;
       await file.readAsText(file.dataDirectory + path, filename)
        .then(data => {
            content = data
        })
        .catch(err => {
            console.log("Error at reading file at "+ path+ "/"+filename);
            console.log(err)
        })
        return content;
   }


    /*
        Crea un directorio si aún no existe uno en la ruta path/dirName
        path debe finalizar con slash /
    */
    static async createDirectoryIfDoesntExist(dirName, path = "") {
        const file = new File();
        let dir_created = false;
        if (await this.directoryExists(dirName, path)) {
            alert("Directory " + file.dataDirectory + path + dirName + " already exists");
            return true;
        } else {
            file.createDir(file.dataDirectory + path, dirName, false).then(
                _ => {
                    alert("Successfully created dir: " + dirName);
                    dir_created = true;
                }
            ).catch(
                err => {
                    alert("Error at creating " + dirName);
                    console.log('Error (Directory Creation): ', err);
                    dir_created = false;
                }
            );
        }
        return dir_created;
    }
}