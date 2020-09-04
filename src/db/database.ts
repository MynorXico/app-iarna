import { Injectable } from '@angular/core';
import { Platform } from "ionic-angular";
import { SQLite, SQLiteObject } from "@ionic-native/sqlite";
import {Peticion } from '../models/peticion.model';

@Injectable()
export class Database{
    readonly database_name: string = "iarna.db";
    readonly table_name: string = "peticion";
    databaseObj: SQLiteObject;

    constructor(
        private platform: Platform,
        private sqlite: SQLite
    ) { 
        this.platform.ready().then(() => {
            this.createDB();
        }).catch(error => {
            alert(error)
        })
    }

    /*
        Metodo que crea la bd si no existe
    */
    createDB() {
        this.sqlite.create({
            name: this.database_name,
            location: 'default'
        })
        .then((db: SQLiteObject) => {
            this.databaseObj = db;
            this.createTable()
        }).catch(e => {
            alert("error " + JSON.stringify(e))
        });
    }

    /*
        Este metodo crea la tabla si no existe
    */
    createTable() {
        this.databaseObj.executeSql(`CREATE TABLE IF NOT EXISTS ${this.table_name} 
            (id INTEGER PRIMARY KEY, estado INTEGER, path varchar(255))`, [])
        .then(() => {}).catch(e => {
            alert("error " + JSON.stringify(e))
        });
    }

    /*
        Esta funcion inserta una fila en la tabla de iarna de 
        manera asincrona.
    */
    insertRow(item: Peticion): Promise<any> {
        return this.databaseObj.executeSql(`INSERT INTO ${this.table_name} (estado, path) 
            VALUES (${item.estado},'${item.path}')`, [])
    }

    /*
        Esta funcion obtiene una fila en la tabla de iarna de 
        manera asincrona.
    */
    getRows(): Promise<any> {
        return this.databaseObj.executeSql(`SELECT * FROM ${this.table_name}`, []);
    }

    /*
        Esta funcion elimina una fila en la tabla de iarna de 
        manera asincrona.
    */
    deleteRow(id: number): Promise<any>{
        return this.databaseObj.executeSql(`DELETE FROM ${this.table_name} WHERE id = ${id}`, [])
    }

    /*
        Esta funcion modifica una fila en la tabla de iarna de 
        manera asincrona.
    */
    updateRow(item: Peticion): Promise<any> {
        return this.databaseObj.executeSql(`
            UPDATE ${this.table_name}
            SET estado = '${item.estado}'
            WHERE id = ${item.id}`, []);
    }
}