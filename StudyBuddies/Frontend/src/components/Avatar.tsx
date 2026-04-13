import { useRef } from 'react';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 512;
const AVATAR_OUTPUT_QUALITY = 0.82;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      reject(new Error('Image must be smaller than 5 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to process image.'));
    image.src = dataUrl;
  });
}

function compressImageToDataUrl(image: HTMLImageElement, mimeType: string) {
  const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(image.width, image.height));
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to process image.');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL(mimeType, AVATAR_OUTPUT_QUALITY);
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [header, body] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  const baseName = filename.replace(/\.[^.]+$/, '') || 'avatar';
  return new File([bytes], `${baseName}.${extension}`, { type: mimeType });
}

async function prepareAvatarFile(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);

  // Use JPEG for oversized camera images to cut payload size significantly.
  const preferredMimeType = file.type === 'image/png' && file.size < 900 * 1024
    ? 'image/png'
    : 'image/jpeg';

  const compressedDataUrl = compressImageToDataUrl(image, preferredMimeType);
  return {
    previewUrl: compressedDataUrl,
    file: dataUrlToFile(compressedDataUrl, file.name),
  };
}

interface AvatarProps {
  letter:    string;
  color:     string;
  url?:      string | null;
  size?:     number;
  square?:   boolean;
  onClick?:  () => void;
}

export function Avatar({ letter, color, url, size=38, square=false, onClick }: AvatarProps) {
  const radius = square ? `${Math.round(size*0.28)}px` : '50%';
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: radius,
        background: url ? 'transparent' : `linear-gradient(135deg, ${color}, ${color}88)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700,
        fontSize: size > 44 ? '1.2rem' : size > 30 ? '0.9rem' : '0.7rem',
        color: 'white', flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
      }}
      onClick={onClick}
    >
      {url
        ? <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : letter
      }
    </div>
  );
}

export function useImageUpload(onFile:(url:string)=>void) {
  const ref = useRef<HTMLInputElement>(null);
  function trigger() { ref.current?.click(); }
  function Input() {
    return (
      <input ref={ref} type="file" accept="image/png,image/jpeg"
        style={{display:'none'}}
        onChange={async e=>{
          const f=e.target.files?.[0];
          if (f) {
            const prepared = await prepareAvatarFile(f);
            onFile(prepared.previewUrl);
          }
          e.target.value='';
        }}
      />
    );
  }
  return {trigger, Input};
}

interface UploadZoneProps {
  currentUrl?: string | null;
  currentColor?: string;
  letter?: string;
  size?: number;
  onFile: (file: File, previewUrl: string) => void | Promise<void>;
  onError?: (message: string) => void;
  label?: string;
}

export function AvatarUploadZone({currentUrl,currentColor='#5b8dee',letter='?',size=80,onFile,onError,label}:UploadZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'14px'}}>
      <div
        style={{
          width:size,height:size,borderRadius:`${Math.round(size*0.22)}px`,
          background:currentUrl?'transparent':`linear-gradient(135deg,${currentColor},${currentColor}88)`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,
          fontSize:size>60?'1.8rem':'1.1rem',color:'white',
          boxShadow:`0 0 24px ${currentColor}44`,
          overflow:'hidden',cursor:'pointer',
          border:'2px dashed rgba(120,160,255,0.25)',
          transition:'all 0.2s',
        }}
        onClick={()=>ref.current?.click()}
        title="Click to upload"
      >
        {currentUrl
          ? <img src={currentUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : letter
        }
      </div>

      <div style={{textAlign:'center'}}>
        <button
          className="btn-ghost"
          style={{fontSize:'0.8rem',padding:'8px 16px'}}
          onClick={()=>ref.current?.click()}
          type="button"
        >
          {currentUrl ? 'Change photo' : 'Upload photo'}
        </button>
        <div style={{fontSize:'0.9rem',color:'var(--text-muted)',marginTop:'6px'}}>
          Upload a PNG or JPG
        </div>
        {label && <div style={{fontSize:'0.7rem',color:'var(--text-muted)',marginTop:'2px'}}>{label}</div>}
      </div>

      <input ref={ref} type="file" accept="image/png,image/jpeg" style={{display:'none'}}
        onChange={async e=>{
          const f=e.target.files?.[0];
          if (f) {
            try {
              const prepared = await prepareAvatarFile(f);
              await onFile(prepared.file, prepared.previewUrl);
            } catch (error) {
              onError?.(error instanceof Error ? error.message : 'Unable to upload image.');
            }
          }
          e.target.value='';
        }}
      />
    </div>
  );
}
