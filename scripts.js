function toggleDevice(device) {
    const button = document.getElementById(`${device}-button`);
    
    if (button.innerText === "Bật") {
        button.innerText = "Tắt";
        button.style.backgroundColor = "#d32f2f"; // Chuyển sang màu đỏ khi bật thiết bị
        button.style.transform = "scale(1.1)";
    } else {
        button.innerText = "Bật";
        button.style.backgroundColor = "#1e88e5"; // Quay lại màu xanh khi tắt thiết bị
        button.style.transform = "scale(1)";
    }
}
