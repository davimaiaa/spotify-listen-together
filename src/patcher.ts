import LTPlayer from "./ltPlayer"

export default class Patcher {
  constructor (public ltPlayer: LTPlayer) {}
  OGPlayerAPI = {
    play: Spicetify.Platform.PlayerAPI.play.bind(Spicetify.Platform.PlayerAPI),
    pause: Spicetify.Platform.PlayerAPI.pause.bind(Spicetify.Platform.PlayerAPI),
    resume: Spicetify.Platform.PlayerAPI.resume.bind(Spicetify.Platform.PlayerAPI),
    seekTo: Spicetify.Platform.PlayerAPI.seekTo.bind(Spicetify.Platform.PlayerAPI),
    skipToNext: Spicetify.Platform.PlayerAPI.skipToNext.bind(Spicetify.Platform.PlayerAPI),
    skipToPrevious: Spicetify.Platform.PlayerAPI.skipToPrevious.bind(Spicetify.Platform.PlayerAPI),
  }

  patchAll() {
    Spicetify.Platform.PlayerAPI.play = (uri: any, origins: any, options: any) => {
      this.restrictAccess(() => this.OGPlayerAPI.play(uri, origins, options), "Only the hosts can change songs!", () => {
        let track: string | undefined = uri.uri
        if (!track?.includes("spotify:track:")) {
          track = options?.skipTo?.uri
        }
        if (track?.includes("spotify:track:")) {
          this.ltPlayer.requestChangeSong(track)
        } else {
          Spicetify.showNotification("Can't play this! Spotify Listen Together can only play songs individually as of now.")
        }
      })
    }
    
    Spicetify.Platform.PlayerAPI.pause = () => {
      this.restrictAccess(() => this.OGPlayerAPI.pause(), "Only the hosts can pause songs!", () => {
        this.ltPlayer.requestUpdateSong(true, Spicetify.Player.getProgress())
      })
    }
    
    Spicetify.Platform.PlayerAPI.resume = () => {
      this.restrictAccess(() => this.OGPlayerAPI.resume(), "Only the hosts can resume songs!", () => {
        this.ltPlayer.requestUpdateSong(false, Spicetify.Player.getProgress())
      })
    }
    
    Spicetify.Platform.PlayerAPI.seekTo = (milliseconds: number) => {
      this.restrictAccess(() => this.OGPlayerAPI.seekTo(milliseconds), "Only the hosts can seek songs!", () => {
        this.ltPlayer.requestUpdateSong(!Spicetify.Player.isPlaying(), milliseconds)
      })
    }
    
    Spicetify.Platform.PlayerAPI.skipToNext = (e: any) => {
      this.restrictAccess(() => this.OGPlayerAPI.skipToNext(e), "Only the hosts can change songs!", () => { })
    }
    
    Spicetify.Platform.PlayerAPI.skipToPrevious = (e: any) => {
      this.restrictAccess(() => this.OGPlayerAPI.skipToPrevious(e), "Only the hosts can change songs!", () => { })
    }
  }
  
  private restrictAccess(ogFunc: Function, restrictMessage: string, hostFunc: Function) {
    if (!this.ltPlayer.client.connected) {
      ogFunc()
    } else if (this.ltPlayer.isHost) {
      hostFunc()
    } else {
      Spicetify.showNotification(restrictMessage)
    }
  }  
}