# File Upload System

This project includes a complete file upload system with progress tracking, drag & drop support, and preview functionality.

## Components

### FileUploader Component

A flexible file uploader component with multiple variants and features.

**Location:** `src/renderer/components/common/FileUploader.tsx`

**Features:**
- 📤 Drag & drop support
- 📊 Upload progress bar
- 🖼️ Image preview
- 🗑️ Remove uploaded files
- 🎨 Multiple variants (default button, outline button, dropzone)
- 📁 File type filtering
- ✅ File size validation (5MB max)

**Usage:**

```tsx
import { FileUploader } from '../components/common/FileUploader';
import { useUpload } from '../hooks/useUpload';

function MyComponent() {
  const { handleUpload, uploadProgress, isUploading } = useUpload();
  const [fileUrl, setFileUrl] = useState<string>();

  return (
    <FileUploader
      id="my-file-uploader"
      accept="image"
      variant="dropzone"
      value={fileUrl}
      onChange={async (file) => {
        try {
          const url = await handleUpload(file, 'my-file-uploader');
          setFileUrl(url);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      }}
      onRemove={() => setFileUrl(undefined)}
      progress={uploadProgress['my-file-uploader'] || 0}
      isUploading={isUploading}
      showPreview={true}
    />
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | required | Unique identifier for the uploader |
| `onChange` | `(file: File) => void` | required | Callback when file is selected |
| `accept` | `'image' \| 'document' \| 'video' \| 'all'` | `'image'` | Accepted file types |
| `variant` | `'default' \| 'outline' \| 'dropzone'` | `'dropzone'` | Visual variant |
| `progress` | `number` | `0` | Upload progress (0-100) |
| `isUploading` | `boolean` | `false` | Whether upload is in progress |
| `value` | `string` | - | Current file URL for preview |
| `onRemove` | `() => void` | - | Callback when file is removed |
| `showPreview` | `boolean` | `true` | Show preview of uploaded file |
| `disabled` | `boolean` | `false` | Disabled state |
| `buttonText` | `string` | - | Custom button text |
| `className` | `string` | - | Additional CSS classes |

## Hooks

### useUpload Hook

A React hook that handles file uploads with progress tracking.

**Location:** `src/renderer/hooks/useUpload.ts`

**Returns:**

```typescript
{
  uploadProgress: { [uploadId: string]: number };  // Progress per upload (0-100)
  isUploading: boolean;                            // Global uploading state
  error: string | null;                            // Last error message
  handleUpload: (file: File, uploadId: string) => Promise<string>;  // Upload function
  resetError: () => void;                          // Clear error
}
```

**Example:**

```tsx
import { useUpload } from '../hooks/useUpload';

function MyComponent() {
  const { handleUpload, uploadProgress, isUploading, error, resetError } = useUpload();

  const onFileSelect = async (file: File) => {
    try {
      const url = await handleUpload(file, 'unique-id');
      console.log('Uploaded to:', url);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => onFileSelect(e.target.files![0])} />
      {isUploading && <p>Progress: {uploadProgress['unique-id']}%</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

## Configuration

Add these environment variables to your `.env` file:

```env
# File Upload
VITE_UPLOAD_ENDPOINT=https://upload.remotedigital.org
VITE_STORAGE_BUCKET=MRGREEN
```

## Supported File Types

### Image Files
- PNG
- JPEG/JPG
- WEBP
- GIF
- Max size: 5MB

### Document Files
- PDF
- DOC/DOCX
- TXT
- Max size: 5MB

### Video Files
- MP4
- WEBM
- Max size: 5MB

## Examples

### Dropzone Variant (Default)
```tsx
<FileUploader
  id="dropzone-example"
  accept="image"
  variant="dropzone"
  onChange={handleFileChange}
/>
```

### Button Variant
```tsx
<FileUploader
  id="button-example"
  accept="document"
  variant="default"
  buttonText="Upload Document"
  onChange={handleFileChange}
/>
```

### With Preview and Remove
```tsx
<FileUploader
  id="preview-example"
  accept="image"
  value={imageUrl}
  showPreview={true}
  onRemove={() => setImageUrl(undefined)}
  onChange={handleFileChange}
/>
```

## Integration Examples

### Settings Page (Logo Upload)
See [Settings.tsx](src/renderer/pages/Settings.tsx) for a complete example of logo upload integration.

### Form Integration
```tsx
import { useForm } from 'react-hook-form';

function ProfileForm() {
  const { register, setValue } = useForm();
  const { handleUpload } = useUpload();

  return (
    <form>
      <FileUploader
        id="avatar"
        accept="image"
        onChange={async (file) => {
          const url = await handleUpload(file, 'avatar');
          setValue('avatarUrl', url);
        }}
      />
    </form>
  );
}
```

## Notes

- Files are automatically validated for size (5MB max)
- Upload progress is tracked per file using unique upload IDs
- The component uses shadcn/ui styling for consistency
- Drag & drop is supported in dropzone variant
- Images show preview, other files show file info
