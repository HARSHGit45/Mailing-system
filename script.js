document.getElementById('mailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const csvFile = document.getElementById('csvFile').files[0];
    const certificatesFolder = document.getElementById('certificatesFolder').files;
    const collegeLogo = document.getElementById('collegeLogo').files[0];
    const club1Logo = document.getElementById('club1Logo').files[0];
    const club2Logo = document.getElementById('club2Logo').files[0];
    const eventLogo = document.getElementById('eventLogo').files[0];
    
    // Validate files
    if (!csvFile || !certificatesFolder.length || !collegeLogo || !club1Logo || !club2Logo || !eventLogo) {
        showError('Please upload all required files');
        return;
    }
    
    // Add files to FormData
    formData.append('csvFile', csvFile);
    for (let file of certificatesFolder) {
        formData.append('certificates', file);
    }
    formData.append('collegeLogo', collegeLogo);
    formData.append('club1Logo', club1Logo);
    formData.append('club2Logo', club2Logo);
    formData.append('eventLogo', eventLogo);
    
    // Add other form data
    formData.append('eventName', document.getElementById('eventName').value);
    formData.append('eventDate', document.getElementById('eventDate').value);
    formData.append('emailSubject', document.getElementById('emailSubject').value);
    formData.append('emailBody', document.getElementById('emailBody').value);
    
    // Show progress bar
    const progressDiv = document.getElementById('progress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const statusText = document.getElementById('status');
    progressDiv.classList.remove('d-none');
    progressBar.style.width = '0%';
    statusText.textContent = 'Processing...';
    
    try {
        // Use the API endpoint for Vercel deployment
        const response = await fetch('https://mailing-system-ii7e.onrender.com/api/send-certificates', {
            method: 'POST',
            body: formData
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }
        
        const result = await response.json();
        
        if (result.success) {
            progressBar.style.width = '100%';
            statusText.textContent = 'Certificates sent successfully!';
            statusText.style.color = '#198754';
        } else {
            throw new Error(result.error || 'Failed to send certificates');
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    }
});

function showError(message) {
    const progressDiv = document.getElementById('progress');
    const progressBar = progressDiv.querySelector('.progress-bar');
    const statusText = document.getElementById('status');
    
    progressBar.style.width = '0%';
    statusText.textContent = `Error: ${message}`;
    statusText.style.color = '#dc3545';
} 