import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Upload() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (file && file.type === 'application/pdf') {
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);
      // Navigate to viewer with the file URL
      navigate('/viewer', { state: { pdfUrl: fileUrl } });
    } else {
      setError('Please upload a valid PDF file');
    }
  };

  return (
    <div style={styles.container}>
      <h1>PDF Uploader</h1>
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileUpload}
        style={styles.input}
      />
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  input: {
    margin: '20px 0',
  },
  error: {
    color: 'red',
  },
};

export default Upload; 
