export default class MediaHandler {
    getPermission(){
        return new Promise((resolve, rej)=>{
            navigator.mediaDevices.getUserMedia({video: true, audio: true})
            .then((stream)=> {
                resolve(stream);
            })
            .catch(err => {
                throw new Error('Unable to fetch stream ${err}');
            })
        })
    }
}