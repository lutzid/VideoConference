import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import MediaHandler from '../MediaHandler';
import Pusher from 'pusher-js';
import Peer from 'simple-peer';

const APP_KEY = '27c8f53e8578d77ac22d';

export default class App extends Component{
    constructor(){
        super();

        this.state = {
            hasMedia: false,
            otherUserId: null
        };

        this.user = window.user;
        this.user.stream = null;
        this.peers = {};

        //Request mic & webcam permission
        this.mediaHandler = new MediaHandler();
        this.setupPusher();

        this.callTo = this.callTo.bind(this);
        this.setupPusher = this.setupPusher.bind(this);
        this.startPeer = this.startPeer.bind(this);
    }

    //If permission is granted, load video 
    componentWillMount(){
        this.mediaHandler.getPermission()
            .then((stream)=>{
                this.setState({hasMedia:true});
                this.user.stream = stream;

                try{
                    this.myVideo.srcObject = stream;
                }catch{
                    this.myVideo.src = URL.createObjectURL(stream);
                }

                this.myVideo.play();
            })
    }

    //Setting Pusher
    setupPusher() {
        Pusher.logToConsole = true;
        this.pusher = new Pusher(APP_KEY, {
            // authHost: "http://localhost/videoconference/public",
            authEndpoint: '/pusher/auth',
            cluster: 'ap1',
            auth: {
                params: this.user.id,
                headers: {
                    'X-CSRF-Token': window.csrfToken
                }
            }
        });

        //Subscribe to channel
        this.channel = this.pusher.subscribe('presence-video-channel');

        this.channel.bind('client-signal-${this.user.id}', (signal) => {
            
            //If a peer is already open
            let peer = this.peers[signal.userId]; 

            //If peer doesn't exist yet (incoming call)
            if(peer == undefined) {
                this.setState({otherUserId: signal.userID});
                peer = this.startPeer(signal.userId, false); 
            }

            peer.signal(signal.data);

        });
    }

    //Start Peer
    startPeer(userId, initiator = true) {
        const peer = new Peer({
            initiator,
            stream: this.user.stream, 
            trickle: false
        });

        //When getting a signal, signal back
        peer.on('signal', (data) => {
            this.channel.trigger('client-signal-${userId}', {
                type: 'signal',
                userId: this.user.id,
                data: data
            });
        });

        //When on stream
        peer.on('stream', (stream) => {
            try{
                this.userVideo.srcObject = stream;
            }catch{
                this.userVideo.src = URL.createObjectURL(stream);
            }

            this.userVideo.play();

        });

        //When closed, destroy peer
        peer.on('close', () => {
            let peer = this.peers[UserId];
            if (peer != undefined) {
                peer.destroy();
            }

            this.peers[userId] = undefined;
        });

        return peer;
    }

    //Call other users
    callTo(userId) {
        this.peers[userId] = this.startPeer(userId);
    }
    
    //To display the video 
    render(){
        return (
            <div className="App">

                {/* Button to call others */}
                {[1,2,3,4].map((userId) => {
                    return this.user.id != userId ? <button key={userId} onClick = {() => this.callTo(userId)}>Call {userId}</button> : null;
                })}

                <div className="video-container">
                    <video className="my-video" ref={(ref)=> {this.myVideo=ref;}}></video>
                    <video className="user-video" ref={(ref)=> {this.userVideo=ref;}}></video>
                </div>
            </div>
        );
    }
}

if (document.getElementById('app')) {
    ReactDOM.render(<App />, document.getElementById('app'));
}
