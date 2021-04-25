let audio = document.getElementById("audio");
let audioWaves = document.getElementById("audio-waves");
audio.onplay = () => {
    audio.classList.add("active");
    audioWaves.classList.add("audio-waves-active")
}
audio.onpause = () => {
    audioWaves.classList.remove("audio-waves-active")
}