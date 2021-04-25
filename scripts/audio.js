let audio = document.getElementById("audio");
audio.onplay = () => {
    audio.classList.add("active");
}