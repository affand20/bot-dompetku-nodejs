//module require
const express = require('express');
const line = require('@line/bot-sdk');
const PROCESS_NODE = require('process');
const firebase = require('firebase');
const storage = require('store/dist/store.modern');

const port = PROCESS_NODE.env.PORT || 3001;

const config = {
    channelAccessToken : 'lxDSFG57mPcz6g6uiyJJxWVMTMf2ud6xKhHDgSHf8Zj3af3OwD/2PvZewztMgP87rdgD697ZahJU/v2uLQcNNIx/GCW1ijK/S2sqQbfx55Y5lSQ1dt17CdnbCaN761Hil2L7Vhv8kekCLAg0wMiUGAdB04t89/1O/w1cDnyilFU=',
    channelSecret : '0df237545cb56f33f0ba68b846631bcf'
}

var configFirebase = {
    apiKey: "AIzaSyA1MMUUZEZEomoklXyedj7CLeMKfL2OIfo",
    authDomain: "dompetku-bot.firebaseapp.com",
    databaseURL: "https://dompetku-bot.firebaseio.com",
    projectId: "dompetku-bot",
    storageBucket: "dompetku-bot.appspot.com",
    messagingSenderId: "89964516030"
}

firebase.initializeApp(configFirebase);
var database = firebase.database();

const app = express();
var menuId = 0;
var eventid = 0;
var targetTabungan = {};
var pengeluaran = {};
app.get('/' , (req, res) => res.send("Hello World"));
app.use('/laporan', express.static('public'))
app.listen(port, () => console.log(`Listening on port ${port}!`));

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

const client = new line.Client(config);
function handleEvent(event) {
    
    // get user id
    client.getProfile(event.source.userId).then((profile)=>{
        // console.log(profile);        
        // writeData(profile.userId, profile.displayName);
    })

    // get data
    // readDataUser();
    
    
    if (event.type === 'message') {
        const message = event.message;        

        if (message.type == 'text') {
            
            const text = message.text;
            
            if (text == "Input Pemasukan" || menuId==1 && (text != "Tabunganku" && text!="Input Pengeluaran" && text!="Lihat Laporan" && text!="Reset Data" && text!="Petunjuk")) {
                menuId = 1;
                if (text=="Input Pemasukan") {
                    client.replyMessage(event.replyToken, {
                        "type":"text",
                        "text":"Berapa duit ?"
                    });                                
                } else if (text.includes("Rp")) {
                    var newText = text.substr(2);
                    if (newText.includes(",00")) {
                        newText = newText.replace(',00', '');                                               
                    }
                    if (newText.includes(",-")) {
                        newText = newText.replace(",-", "");
                    }
                    newText = newText.replace('.', '');
                    newText = newText.trim();                    
                    // if (newText.length>3) {
                    //     newText = newText.split("").reverse().join("").match(/.{1,3}/g);                        
                    //     for (let i = 0; i < newText.length-1; i++) {                            
                    //         newText[i] = newText[i].split("").reverse().join("");
                    //     }                        
                    //     newText = newText.reverse().join(".");
                    // }
                    // newText = "Rp "+newText;
                    
                    inputPemasukan(event.source.userId, parseInt(newText), event.replyToken);

                } else{
                    client.replyMessage(event.replyToken, {
                        "type":"text",
                        "text":"Formatnya yang bener dong, tambahin Rp didepan nominal uangnya"
                    })
                }
            }                        
            
            else if (text == "Tabunganku" || menuId == 3 
                    && (eventid==0||eventid==1||eventid==2||eventid==3||eventid==4)
                    && (text!="Input Pemasukan" && text!="Input Pengeluaran" && text!="Lihat Laporan" && text!="Reset Data" && text!="Petunjuk")
                ) {
                menuId = 3;   
                
                if (text=="Edit Daftar Tabunganku") {
                    eventid = 0;
                    return getTargetTabungan(event.source.userId, event.replyToken);
                }

                if (text.includes("Hapus")) {
                    eventid = 0;
                    var namaTabungan = text.substr(6);
                    console.log(namaTabungan);
                    
                    return hapusTabungan(event.source.userId, namaTabungan, event.replyToken);
                }
                                
                if (text=="Tabunganku") {
                    eventid = 0;
                    getSisaUang(event.source.userId, event.replyToken);
                }                

                if (menuId==3 && eventid==3 && (text!="Tambah Daftar Tabunganku")) {
                    if (text=='tetap'||text=="tetep"||text=="Tetap"||text=="Tetep") {
                        targetTabungan.judul = "tetap";
                    } else{
                        targetTabungan.judul = text;
                    }
                    
                    eventid = 4;
                    return client.replyMessage(event.replyToken, {
                        'type':'text',
                        'text':'Target barunya berapa om ?'
                    })
                }

                if (menuId==3 && eventid==2 || eventid==4) {
                    if (text.includes("Rp")) {
                        var newText = text.substr(2);
                        if (newText.includes(",00")) {
                            newText = newText.replace(',00', '');                                               
                        }
                        if (newText.includes(",-")) {
                            newText = newText.replace(",-", "");
                        }
                        var textNominal = "Rp "+newText;
                        newText = newText.split('.').join('');
                        newText = newText.trim();                    
    
                        targetTabungan.nominal = newText;
                        
                        if (eventid==4) {
                            console.log('masuk');
                            
                            editTabungan(event.source.userId, targetTabungan.judulLama, targetTabungan.judul, targetTabungan.nominal, textNominal, event.replyToken);
                        } else if(eventid==2){
                            inputTargetTabungan(event.source.userId, targetTabungan.judul, targetTabungan.nominal, textNominal, event.replyToken);
                        }
    
                    } else if(text=="tetap"||text=='tetep'||text=='Tetap'||text=='Tetep'){
                        editTabungan(event.source.userId, targetTabungan.judulLama, targetTabungan.judul, "tetap", "tetap", event.replyToken);
                    } else{
                        client.replyMessage(event.replyToken, {
                            "type":"text",
                            "text":"Formatnya yang bener om, tambahin Rp didepan nominal uangnya"
                        })
                    }
                }

                if (menuId==3 && eventid==1) {
                    eventid = 2;                
                    targetTabungan.judul = text;
                    client.replyMessage(event.replyToken, [
                        {
                            "type":"text",
                            "text":"Mantap, "+text
                        },
                        {
                            "type":"text",
                            "text":"Targetnya berapa om ?"
                        }
                    ])
                }

                if (text=="Lihat Daftar Tabunganku") {                                        
                    
                    return getTargetTabungan(event.source.userId, event.replyToken);
                }

                if (text=="Ya, tambah sekarang") {                    
                    eventid=1;
                    return client.replyMessage(event.replyToken,{
                        "type":"text",
                        "text":"Oke, apa nama tabungannya om ?"
                    })
                    
                }

                if (text=="Tambah Daftar Tabunganku") {
                    eventid = 1;
                    return client.replyMessage(event.replyToken, {
                        'type':'text',
                        'text':'Oke, nama tabungannya apa nih om ?'
                    })                    
                }

                

                if (text.includes('Edit')) {
                    eventid = 3;
                    var judulLama = text.substr(5);
                    targetTabungan.judulLama = judulLama
                    return client.replyMessage(event.replyToken,{
                        'type':'text',
                        'text':'Diganti apa nih om namanya ?'
                    })
                }
                
            }

            else if (text == "Input Pengeluaran" || menuId == 2 
                    && (text!="Input Pemasukan" && text!="Tabunganku" && text!="Lihat Laporan" && text!="Petunjuk" && text!="Reset Data")
                ) {
                menuId = 2;

                if (menuId==2 && eventid==2) {
                    if (text.includes("Rp")) {
                        var newText = text.substr(2);
                        if (newText.includes(",00")) {
                            newText = newText.replace(',00', '');                                               
                        }
                        if (newText.includes(",-")) {
                            newText = newText.replace(",-", "");
                        }
                        newText = newText.replace('.', '');
                        newText = newText.trim();                    
                        
                        pengeluaran.nominal = newText;

                        return inputPengeluaran(event.source.userId, pengeluaran.judul, pengeluaran.nominal, event.replyToken);

                    } else{
                        return client.replyMessage(event.replyToken, {
                            "type":"text",
                            "text":"Formatnya yang bener dong, tambahin Rp didepan nominal uangnya"
                        })
                    }
                }

                if (menuId==2 && eventid==1) {
                    pengeluaran.judul = text;
                    eventid = 2;
                    return client.replyMessage(event.replyToken,{
                        'type':'text',
                        'text':'Ngeluarin berapa duit om ?'
                    })
                }
                
                if (text == "Input Pengeluaran") {
                    eventid = 1;
                    return client.replyMessage(event.replyToken, {
                        'type':'text',
                        'text':'Tujuannya buat apa om ?'
                    })
                }
            }

            else if(text=="Lihat Laporan" || menuId==4
                    && (text!="Input Pemasukan" && text!="Input Pengeluaran" && text!="Tabunganku" && text!="Reset Data" && text!="Petunjuk")
                ){
                menuId = 4;
                getLaporan(event.source.userId, event.replyToken);
            }

            else if(text=="Reset Data"||menuId==5 
                    && (text!="Input Pemasukan" && text!="Input Pengeluaran" && text!="Tabunganku" && text!="Petunjuk" && text!="Lihat Laporan")
                ){
                menuId = 5;
                
                if (text=="Reset Data") {
                    return client.replyMessage(event.replyToken, {
                        "type":"template",
                        "altText":"Ente yakin mau hapus semua data dompetku ?",
                        "template":{
                            "type":"confirm",
                            "actions":[
                                {
                                    "type":"message",
                                    "label":"Ya",
                                    "text":"Ya, hapus semua"
                                },
                                {
                                    "type":"message",
                                    "label":"Nggak",
                                    "text":"Nggak"
                                }
                            ],
                            "text":"Ente yakin mau hapus semua data dompetku ?"
                        }                    
                    })
                } else if (text=="Ya, hapus semua") {
                    resetData(event.source.userId);
                }
            }

            else{
                return client.replyMessage(event.replyToken, {
                    'type':'text',
                    'text':'Mohon memilih menu yang tersedia terlebih dahulu'
                })
            }
            
        }
    } else{
        return Promise.resolve(null);
    }
}

function writeData(userId, name) {        
    database.ref('users/'+userId).set({
        userId: userId,
        name: name,
    }, (error) => {
        if (error) {
            console.log('gagal');            
        } else{
            console.log('berhasil');            
        }
    });
}

function readDataUser() {
    return database.ref('/users/').once('value')
        .then((snapshot)=>{
            console.log(snapshot.val());            
        })
}

function getLaporan(userId) {
    var reference = database.ref('users/'+userId+'/pemasukan/');
    reference.orderByValue().on('value', (snapshot)=>{
        snapshot.forEach((data)=>{
            console.log(data.val());
            
        })
    })
}

function inputPemasukan(userId, nominal, replyToken) {    
    
    const date = new Date();
    const now = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();    
    database.ref('users/'+userId+'/tabungan').once('value').then((data) => {
        // data.exists() => buat cek ada valuenya atau enggak
        // console.log(data.val());
        
        
        if (data.exists()) {
            var updateTotal = (data.val().total+nominal);
            // console.log("update="+(updateTotal));
            database.ref('users/'+userId+'/tabungan').set({
                total:updateTotal
            })
        } else{
            database.ref('users/'+userId+'/tabungan').set({
                total:nominal
            })
        }
    })

    database.ref('users/'+userId+'/pemasukan/'+now).push({
        tanggal:now,
        nominal:nominal,
    }, (error)=>{
        if (error) {
            return client.replyMessage(replyToken, {
                "type":"text",
                "text":"Maaf, gagal menyimpan :("
            })
        } else{
            menuId = 0;
            return client.replyMessage(replyToken, {
                "type":"text",
                "text":"Sip, berhasil ane simpen om !!"
            })
        }
    })
}

function inputPengeluaran(userId, judul, nominal, replyToken) {
    
    const date = new Date();
    const now = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();    
    database.ref('users/'+userId+'/tabungan').once('value').then((data) => {
        // data.exists() => buat cek ada valuenya atau enggak
        // console.log(data.val());
        
        
        if (data.exists()) {
            var updateTotal = (data.val().total-nominal);
            // console.log("update="+(updateTotal));
            database.ref('users/'+userId+'/tabungan').set({
                total:updateTotal
            })
        } else{
            database.ref('users/'+userId+'/tabungan').set({
                total:(nominal*-1)
            })
        }
    })

    database.ref('users/'+userId+'/pengeluaran/'+now).push({
        judul:judul,
        tanggal:now,
        nominal:nominal,
    }, (error)=>{
        if (error) {
            return client.replyMessage(replyToken, {
                "type":"text",
                "text":"Maaf, gagal menyimpan :("
            })
        } else{
            menuId = 0;
            return client.replyMessage(replyToken, [
                {
                    "type":"text",
                    "text":"Sip, berhasil ane simpen om !!"
                },
                {
                    'type':'text',
                    'text':'Jangan boros-boros ya om, semangat nabungnya :D'
                }
            ])
        }
    })
}

function getTargetTabungan(userId, replyToken) {
    return database.ref('users/'+userId+'/tabungan/target/').once('value').then((target) => {
        if (!target.exists()) {
            
            return client.replyMessage(replyToken, [
                {
                    "type":"text",
                    "text":"Ente belum punya daftar tabungan om"
                },
                {
                    "type":"template",
                    "altText":"Tambah daftar tabungan sekarang ?",
                    "template":{
                        "type":"confirm",
                        "actions":[
                            {
                                "type":"message",
                                "label":"Ya",
                                "text":"Ya, tambah sekarang"
                            },
                            {
                                "type":"message",
                                "label":"Nggak",
                                "text":"Nggak"
                            }
                        ],
                        "text":"Mau tambah daftar tabungan sekarang ?"
                    }                    
                }
            ]);            
        } else{     
            var balasan = {
                "type": "template",
                "altText": "Daftar Target Tabungan",
                "template": {
                    "type": "carousel",
                    "actions": [],
                    "columns": []
                }
            }

            target.forEach((data)=>{
                var value = data.val();
                // console.log(value);
                
                balasan.template.columns.push({
                    "title": value.judul,
                    "text": value.textNominal,
                    "actions": [
                        {
                            "type": "message",
                            "label": "Edit",
                            "text": "Edit "+value.judul
                        },
                        {
                            "type": "message",
                            "label": "Hapus",
                            "text": "Hapus "+value.judul
                        }
                    ]
                })               
            })
            return client.replyMessage(replyToken, balasan);
        }
    }).catch((reject)=>{
        console.log(reject);
        
    })
}

function getSisaUang(userId, replyToken) {
    var uangku;
    database.ref('users/'+userId+'/tabungan').once('value').then((sisa) => {
        if (sisa.exists()) {
            uangku = sisa.val().total;
        } else{
            uangku = 0;
        }
        
        return client.replyMessage(replyToken, {
            "type": "template",
            "altText": "Menu Tabungan",
            "template": {
                "type": "buttons",
                "actions": [
                {
                    "type": "message",
                    "label": "Daftar Tabunganku",
                    "text": "Lihat Daftar Tabunganku"
                },
                {
                    "type": "message",
                    "label": "Tambah Daftar",
                    "text": "Tambah Daftar Tabunganku"
                },
                {
                    "type": "message",
                    "label": "Edit Daftar",
                    "text": "Edit Daftar Tabunganku"
                }
                ],
                "title": "Tabunganmu",
                "text": "Uang kamu saat ini : "+uangku
            }
        })
    })    
}

function inputTargetTabungan(userId, judul, nominal, textNominal, replyToken) {
    var reference = database.ref('users/'+userId+'/tabungan/target/');
    reference.once('value').then((data)=>{        
        if (data.numChildren()<=10) {
            reference.push({
                judul:judul,
                nominal:nominal,
                textNominal:textNominal
            }, (error)=>{
                if (error) {
                    return client.replyMessage(replyToken, {
                        'type':'text',
                        'text':'Monmaap, input gagal. Coba koneksi ente om'
                    })
                } else{
                    menuId = 0;
                    eventid = 0;
                    return client.replyMessage(replyToken,{
                        "type":"text",
                        "text":"Sip, dah ane simpen om. Semangat ye nabungnya"
                    })
                }
                
            })
        } else{
            return client.replyMessage(replyToken,{
                'type':'text',
                'text':'Monmaap, target tabungan udah mentok om'
            })
        }
    })
        
}

function hapusTabungan(userId, namaTabungan, replyToken){        
    var reference = database.ref('users/'+userId+'/tabungan/target/');
    return reference.once('value').then((data)=>{  
                      
        
        data.forEach((snapshot)=>{
            // console.log(reference.child(snapshot.key));
            
            if (snapshot.val().judul==namaTabungan) {
                reference.child(snapshot.key).remove()
                    .then((error)=>{
                        if (error) {
                            return client.replyMessage(replyToken, {
                                'type':'text',
                                'text':'Gagal hapus om, cek koneksi deh'
                            })
                        } else{
                            return client.replyMessage(replyToken, {
                                'type':'text',
                                'text':'Berhasil ane hapus om'
                            })
                        }
                    })
            }
        })
    })
}

function editTabungan(userId, judulLama, judul, nominal, textNominal, replyToken) {
    console.log(judul+"\t"+nominal);
    
    var edit = true
    if (judul=="tetap" && nominal=="tetap") {
        edit = false;
        return client.replyMessage(replyToken, {
            'type':'text',
            'text':'Lahh gajadi dirubah om ? wkwk'
        })
    };
    if (edit) {
        var reference = database.ref('users/'+userId+"/tabungan/target/");
        reference.once('value').then((res)=>{
            res.forEach((data)=>{
                if (data.val().judul==judulLama) {
                    if (judul=="tetap") {
                        reference.child(data.key).update({                            
                            nominal:nominal,
                            textNominal:textNominal
                        }, (error)=>{
                            if (error) {
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Gagal update om, cek koneksi deh'
                                })
                            } else{
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Berhasil ane update om'
                                })
                            }
                        })
                    } else if(nominal=="tetap"){
                        reference.child(data.key).update({                            
                            judul:judul
                        }, (error)=>{
                            if (error) {
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Gagal update om, cek koneksi deh'
                                })
                            } else{                                
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Berhasil ane update om'
                                })
                            }
                        })
                    } else{
                        reference.child(data.key).update({                            
                            judul:judul,
                            nominal:nominal,
                            textNominal:textNominal
                        }, (error)=>{
                            if (error) {
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Gagal update om, cek koneksi deh'
                                })
                            } else{                                
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Berhasil ane update om'
                                })
                            }
                        })
                    }
                    
                }
            })
        })
    }
    eventid=0;
}

function resetData(userId, replyToken) {
    var pemasukan = database.ref('users/'+userId+'/pemasukan');
    var pengeluaran = database.ref('users/'+userId+'/pengeluaran');
    var tabungan = database.ref('users/'+userId+'/tabungan');

    pemasukan.remove().then(()=>{
        pengeluaran.remove().then(()=>{
            tabungan.remove().then(()=>{
                console.log('success');
                client.replyMessage(replyToken, {
                    'type':'text',
                    'text':'Data telah dihapus. Saatnya memulai awal yang baru, yuk makin giat menabung :)'
                })
            })
        })
    })
}