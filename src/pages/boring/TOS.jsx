import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import "../../styles/tos.css";

const TOS = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: () => [], // Optional: hide thumbnails, bookmarks, etc.
  });

  return (
    <div className="tos">
      <h1 className="tos-title">Terms of Service</h1>
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl="/Terms_Of_Service.pdf"
          plugins={[defaultLayoutPluginInstance]}
        />
      </Worker>
    </div>
  );
};


export default TOS;