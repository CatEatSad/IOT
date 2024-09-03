function changeAvatar() {
    const input = document.getElementById('avatar-upload');
    const avatar = document.getElementById('avatar');

    // Load the saved avatar from localStorage
    const savedAvatar = localStorage.getItem('savedAvatar');
    if (savedAvatar) {
        avatar.src = savedAvatar;
    } else {
        avatar.src = 'https://via.placeholder.com/150';
    }

    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatar.src = event.target.result;
                localStorage.setItem('savedAvatar', event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}
changeAvatar();