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
var pemasukan = {};
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
            
            if (text == "Input Pemasukan" || menuId==1 && 
                (eventid == 6 || eventid == 7) &&
                (text != "Tabunganku" && text!="Input Pengeluaran" && text!="Lihat Laporan" && text!="Reset Data" && text!="Petunjuk")) {
                menuId = 1;                
                    
                if (menuId==1&&eventid==7) {
                    if (text.includes("Rp")) {
                        pemasukan.textNominal = text;
                        var newText = text.substr(2);
                        if (newText.includes(",00")) {
                            newText = newText.replace(',00', '');                                               
                        }
                        if (newText.includes(",-")) {
                            newText = newText.replace(",-", "");
                        }
                        newText = newText.split(".").join("");
                        newText = newText.trim();             
                        // console.log("nominal="+newText);
                                   
                        pemasukan.nominal = newText;
                        // if (newText.length>3) {
                        //     newText = newText.split("").reverse().join("").match(/.{1,3}/g);                        
                        //     for (let i = 0; i < newText.length-1; i++) {                            
                        //         newText[i] = newText[i].split("").reverse().join("");
                        //     }                        
                        //     newText = newText.reverse().join(".");
                        // }
                        // newText = "Rp "+newText;
                        
                        // inputPemasukan(event.source.userId, parseInt(newText), event.replyToken);
                        inputPemasukan(event.source.userId, pemasukan.judul, parseInt(pemasukan.nominal), pemasukan.textNominal, event.replyToken);
    
                    } else{
                        client.replyMessage(event.replyToken, {
                            "type":"text",
                            "text":"Formatnya salah kak, tambahin Rp didepan nominalnya.."
                        })
                    }
                }

                if (menuId==1&&eventid==6) {
                    pemasukan.judul = text;
                    eventid = 7;
                    // console.log("totalnya berapa, eventid"+eventid);
                    
                    client.replyMessage(event.replyToken, {
                        "type":"text",
                        "text":"Totalnya berapa kak ?"
                    })
                }

                if (text=="Input Pemasukan") {
                    eventid = 6;
                    client.replyMessage(event.replyToken,{
                        "type":"text",
                        "text":"Duit darimana kak ?"
                    });
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
                        'text':'Target barunya berapa kakak ?'
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
                            "text":"Targetnya berapa kak ?"
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
                        "text":"Oke, apa nama tabungannya kak ?"
                    })
                    
                }

                if (text=="Tambah Daftar Tabunganku") {
                    eventid = 1;
                    return client.replyMessage(event.replyToken, {
                        'type':'text',
                        'text':'Oke, nama tabungannya apa nih kak ?'
                    })                    
                }

                

                if (text.includes('Edit')) {
                    eventid = 3;
                    var judulLama = text.substr(5);
                    targetTabungan.judulLama = judulLama
                    return client.replyMessage(event.replyToken,{
                        'type':'text',
                        'text':'Diganti apa nih kak namanya ?'
                    })
                }
                
            }

            else if (text == "Input Pengeluaran" || menuId == 2 
                    && (text!="Input Pemasukan" && text!="Tabunganku" && text!="Lihat Laporan" && text!="Petunjuk" && text!="Reset Data")
                ) {
                menuId = 2;

                if (menuId==2 && eventid==2) {
                    if (text.includes("Rp")) {
                        pengeluaran.textNominal = text;
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

                        return inputPengeluaran(event.source.userId, pengeluaran.judul, parseInt(pengeluaran.nominal), pengeluaran.textNominal, event.replyToken);

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
                        'text':'Ngeluarin berapa duit kak ?'
                    })
                }
                
                if (text == "Input Pengeluaran") {
                    eventid = 1;
                    return client.replyMessage(event.replyToken, {
                        'type':'text',
                        'text':'Tujuannya buat apa kak ?'
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
                        "altText":"Kakak yakin mau hapus semua data dompetku ?",
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
                            "text":"Kakak yakin mau hapus semua data dompetku ?"
                        }                    
                    })
                } else if (text=="Ya, hapus semua") {
                    resetData(event.source.userId, event.replyToken);
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

function inputPemasukan(userId, judul, nominal, textNominal, replyToken) {    
    
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
        judul:judul,
        textNominal:textNominal
    }, (error)=>{
        if (error) {
            return client.replyMessage(replyToken, {
                "type":"text",
                "text":"Maaf kak, gagal menyimpan :("
            })
        } else{
            menuId = 0;
            eventid = 0;
            return client.replyMessage(replyToken, {
                "type":"text",
                "text":"Sip, berhasil aku simpen kak !!"
            })
        }
    })
}

function inputPengeluaran(userId, judul, nominal, textNominal, replyToken) {
    
    const date = new Date();
    const now = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();    
    database.ref('users/'+userId+'/tabungan').once('value').then((data) => {
        // data.exists() => buat cek ada valuenya atau enggak
        // console.log(data.val());
        
        
        if (data.exists()) {
            var updateTotal = (data.val().total-nominal);
            // console.log("update="+(updateTotal));
            database.ref('users/'+userId+'/tabungan').update({
                total:updateTotal
            })
        } else{
            database.ref('users/'+userId+'/tabungan').update({
                total:(nominal*-1)
            })
        }
    })

    database.ref('users/'+userId+'/pengeluaran/'+now).push({
        judul:judul,
        tanggal:now,
        nominal:nominal,
        textNominal:textNominal,
    }, (error)=>{
        if (error) {
            return client.replyMessage(replyToken, {
                "type":"text",
                "text":"Maaf kak, gagal menyimpan :("
            })
        } else{
            menuId = 0;
            return client.replyMessage(replyToken, [
                {
                    "type":"text",
                    "text":"Sip, berhasil tak simpen kak !!"
                },
                {
                    'type':'text',
                    'text':'Jangan boros-boros ya kak, semangat nabungnya :D'
                }
            ])
        }
    })
}

function getTargetTabungan(userId, replyToken) {
    var ref = database.ref('users/'+userId+'/tabungan/target/');
    ref.once('value').then((target) => {
        if (!target.exists()) {
            
            return client.replyMessage(replyToken, [
                {
                    "type":"text",
                    "text":"Ente belum punya daftar tabungan kak"
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
            var i = 0;
            var promise = database.ref('users/'+userId+"/tabungan/total").once('value');
            // balasan.contents.contents[i].contents[4].contents[1].contents[2].text
            
            var balasan = {
                "type": "flex",
                "altText": "Daftar Tabunganmu",
                "contents": {
                    "type":"carousel",
                    "contents":[]
                }                
              }            
            
            target.forEach((data)=>{
                var value = data.val();                                
                
                balasan.contents.contents.push({
                    "type": "bubble",
                    "body": {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "text",
                          "text": "TABUNGANKU",
                          "weight": "bold",
                          "color": "#1DB446",
                          "size": "xs"
                        },
                        {
                          "type": "text",
                          "text": value.judul,
                          "weight": "bold",
                          "margin": "md",
                          "size": "xxl",
                          "wrap": true
                        },
                        {
                          "type": "separator",
                          "margin": "xxl"
                        },
                        {
                          "margin": "lg",
                          "type": "box",
                          "spacing": "md",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "box",
                              "layout": "horizontal",
                              "contents": [
                                {
                                  "type": "text",
                                  "text": "Tabunganmu",
                                  "size": "sm"
                                },
                                {
                                  "type": "text",
                                  "text": "Rp 700.000",
                                  "size": "sm",
                                  "align": "end"
                                }
                              ]
                            },
                            {
                              "type": "box",
                              "layout": "horizontal",
                              "contents": [
                                {
                                  "type": "text",
                                  "text": "Target Tabungan",
                                  "size": "sm"
                                },
                                {
                                  "type": "text",
                                  "text": value.textNominal,
                                  "size": "sm",
                                  "align": "end"
                                }
                              ]
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "box",
                              "layout": "horizontal",
                              "contents": [
                                {
                                  "type": "text",
                                  "text": "Sisa Target",
                                  "size": "sm"
                                },
                                {
                                  "type": "text",
                                  "text": "Rp 19.300.000",
                                  "size": "sm",
                                  "align": "end"
                                }
                              ]
                            },
                            {
                              "type": "filler"
                            },
                            {
                              "type": "filler"
                            },
                            {
                              "type": "text",
                              "margin": "xxl",
                              "text": "Semangat Nabungnya :)",
                              "color": "#cecece",
                              "size": "xxs",
                              "align": "center"
                            }
                          ]
                        }
                      ]
                    },
                    "footer": {
                      "type": "box",
                      "layout": "horizontal",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "button",
                          "action": {
                            "type": "message",
                            "label": "Edit",
                            "text": "Edit Naik Haji"
                          },
                          "style": "primary"
                        },
                        {
                          "type": "button",
                          "action": {
                            "type": "message",
                            "label": "Hapus",
                            "text": "Hapus Naik Haji"
                          },
                          "style": "primary",
                          "color": "#dc3545"
                        }
                      ]
                    }
                  })

            })            
            promise.then((tabunganku)=>{
                // console.log("masuk");                
                // console.log(balasan.contents.contents.length);                
                var tabungan = 0, nominal = 0;                
                if (tabunganku.exists()) {
                    tabungan = tabunganku.val().toString();
                    nominal = tabungan;
                }                
                
                
                // console.log("tabungan = "+tabunganku.val());
                
                // console.log(tabungan.toString().length);                
                if (tabungan.length>3) {                    
                    tabungan = tabungan.split("").reverse().join("").match(/.{1,3}/g);                        
                    // console.log("text="+tabungan);
                    
                    for (let i = 0; i < tabungan.length; i++) {                            
                        tabungan[i] = tabungan[i].split("").reverse().join("");                                                
                    }                        
                    tabungan = tabungan.reverse().join(".");
                }                
                // console.log("tabungan="+tabungan);
                
                tabungan = "Rp "+tabungan;
              for (let j = 0; j < balasan.contents.contents.length; j++) {
                  balasan.contents.contents[j].body.contents[3].contents[0].contents[1].text = tabungan;
                  var target = balasan.contents.contents[j].body.contents[3].contents[1].contents[1].text;
                  target = target.substr(2);
                    if (target.includes(",00")) {
                        target = target.replace(',00', '');                                               
                    }
                    if (target.includes(",-")) {
                        target = target.replace(",-", "");
                    }
                    target = target.split('.').join("");
                    target = target.trim();
                    var sisa = ((nominal-target)*-1).toString();                    
                    if (sisa.length>3) {                        
                        sisa = sisa.split("").reverse().join("").match(/.{1,3}/g);                                                
                        
                        // console.log("text="+sisa);                        
                        for (let i = 0; i < sisa.length; i++) {                            
                            sisa[i] = sisa[i].split("").reverse().join("");                                                
                        }                        
                        sisa = sisa.reverse().join(".");
                    }
                    sisa = "Rp "+sisa;                    
                    balasan.contents.contents[j].body.contents[3].contents[3].contents[1].text = sisa;                    
              }              
              
            }).then(()=>{
                return client.replyMessage(replyToken, balasan);
            })                                
        }
    }).catch((reject)=>{
        console.log("rejected "+reject);
        
    })
}

function getSisaUang(userId, replyToken) {
    var uangku;
    database.ref('users/'+userId+'/tabungan/total').once('value').then((sisa) => {
        if (sisa.exists()) {
            uangku = sisa.val().total;
            uangku = uangku.toString();
            if (uangku.length>3) {                
                uangku = uangku.split("").reverse().join("").match(/.{1,3}/g);                        
                
                for (let i = 0; i < uangku.length; i++) {                            
                    uangku[i] = uangku[i].split("").reverse().join("");                                                
                }                        
                uangku = uangku.reverse().join(".");
            }
            uangku = "Rp "+uangku;
        } else{
            uangku = "Rp "+0;            
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
                        'text':'Waduuuh, input gagal. Coba koneksi kaka :(('
                    })
                } else{
                    menuId = 0;
                    eventid = 0;
                    return client.replyMessage(replyToken,{
                        "type":"text",
                        "text":"Sip, sudah aku simpen kak. Semangat yaa nabungnya"
                    })
                }
                
            })
        } else{
            return client.replyMessage(replyToken,{
                'type':'text',
                'text':'Monmaap, target tabungan udah mentok kakk'
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
                                'text':'Gagal hapus kak, cek koneksi deh'
                            })
                        } else{
                            return client.replyMessage(replyToken, {
                                'type':'text',
                                'text':'Berhasil aku hapus kak'
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
            'text':'Lahh gajadi dirubah kak ? wkwk'
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
                                    'text':'Gagal update kak, cek koneksi deh'
                                })
                            } else{
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Berhasil aku update kak'
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
                                    'text':'Gagal update kak, cek koneksi deh'
                                })
                            } else{                                
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Berhasil aku update kak'
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
                                    'text':'Gagal update kak, cek koneksi deh'
                                })
                            } else{                                
                                return client.replyMessage(replyToken, {
                                    'type':'text',
                                    'text':'Berhasil aku update kak'
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