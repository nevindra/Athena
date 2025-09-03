# Athena API Guide: Image Analysis with Structured JSON Response

## Overview

Athena's API allows you to send images to AI models and receive structured JSON responses instead of natural language text. This is perfect for applications that need consistent, parseable data from image analysis.

**Two approaches available:**
- **Stateless Flow**: Single API call, no session management (recommended for simple use cases)
- **Stateful Flow**: Session-based with conversation history (recommended for multi-turn interactions)

## Quick Comparison

| Feature | Stateless | Stateful |
|---------|-----------|----------|
| **API Calls** | 1 call | 3 calls |
| **Session Management** | None | Required |
| **Image Upload** | Base64 in JSON | Multipart form data |
| **Conversation History** | No | Yes |
| **Use Case** | One-off analysis | Multi-turn conversations |
| **Complexity** | Simple | More control |

## Prerequisites

- **Base URL**: `http://localhost:3000` (or your deployed server)
- **Authentication**: User ID and Configuration ID
- **System Prompt**: A structured output prompt configured in your system

## Option 1: Stateless Flow (Recommended for Simple Use Cases)

Perfect for applications that need quick, one-off image analysis with structured results.

### Single API Call with Files Array

```http
POST http://localhost:3000/api/ai/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Analyze this image and detect all objects with confidence scores"
    }
  ],
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "systemPromptId": "object_detection_prompt_id",
  "files": [
    {
      "name": "image.jpg",
      "type": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQAAAQABAAD..." // base64 without data URL prefix
    }
  ]
}
```

### Response

```json
{
  "success": true,
  "data": {
    "message": "{\"objects_detected\":[{\"name\":\"car\",\"confidence\":0.95,\"bounding_box\":{\"x\":120,\"y\":80,\"width\":200,\"height\":150}},{\"name\":\"person\",\"confidence\":0.88,\"bounding_box\":{\"x\":340,\"y\":180,\"width\":60,\"height\":120}}],\"scene_type\":\"street\",\"total_objects\":2}",
    "model": "gemini-2.5-pro",
    "finishReason": "stop",
    "usage": {
      "promptTokens": 845,
      "completionTokens": 156,
      "totalTokens": 1001
    }
  }
}
```

### Multiple Images Example

```http
POST http://localhost:3000/api/ai/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Analyze these images for safety compliance issues"
    }
  ],
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "systemPromptId": "safety_compliance_prompt_id",
  "files": [
    {
      "name": "worksite_photo.jpg",
      "type": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQAAAQABAAD..." // base64 without data URL prefix
    },
    {
      "name": "equipment_check.png",
      "type": "image/png",
      "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk..."
    }
  ]
}
```

## Option 2: Stateful Flow (Session-Based)

Best for applications that need conversation history, multi-turn interactions, or better file management.

### Step 1: Create Session

```http
POST http://localhost:3000/api/sessions
Content-Type: application/json

{
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "title": "Image Analysis Session",
  "initialMessage": "Please analyze the uploaded images"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm5p0n9s70001hzxk8qj7nwvx",
    "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "title": "Image Analysis Session",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### Step 2: Upload Images

```http
POST http://localhost:3000/api/sessions/cm5p0n9s70001hzxk8qj7nwvx/messages
Content-Type: multipart/form-data

--boundary123
Content-Disposition: form-data; name="role"

user
--boundary123
Content-Disposition: form-data; name="content"

Analyze these images and extract key objects with confidence scores
--boundary123
Content-Disposition: form-data; name="files"; filename="street_scene.jpg"
Content-Type: image/jpeg

[Binary image data...]
--boundary123
Content-Disposition: form-data; name="files"; filename="interior_shot.png"
Content-Type: image/png

[Binary image data...]
--boundary123--
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm5p0n9s70002hzxk8qj7nwvx",
    "sessionId": "cm5p0n9s70001hzxk8qj7nwvx",
    "role": "user",
    "content": "Analyze these images and extract key objects with confidence scores",
    "attachments": [
      {
        "id": "01HZXK8QJ7NWVX5G2YBHD3FE4M",
        "filename": "street_scene.jpg",
        "mimeType": "image/jpeg",
        "size": 1024567
      },
      {
        "id": "01HZXK8QJ7NWVX5G2YBHD3FE4N",
        "filename": "interior_shot.png",
        "mimeType": "image/png",
        "size": 512348
      }
    ],
    "createdAt": "2024-01-01T10:01:00.000Z"
  }
}
```

### Step 3: Generate Structured Response

```http
POST http://localhost:3000/api/ai/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Analyze these images and extract key objects with confidence scores"
    }
  ],
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "sessionId": "cm5p0n9s70001hzxk8qj7nwvx",
  "systemPromptId": "structured_vision_prompt_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "{\"image_1_analysis\":{\"objects_detected\":[\"car\",\"person\",\"building\",\"street_sign\"],\"confidence_scores\":[0.95,0.88,0.92,0.76],\"scene_type\":\"urban_street\",\"dominant_colors\":[\"gray\",\"blue\",\"black\"]},\"image_2_analysis\":{\"objects_detected\":[\"sofa\",\"table\",\"lamp\",\"window\"],\"confidence_scores\":[0.94,0.89,0.82,0.91],\"scene_type\":\"living_room\",\"dominant_colors\":[\"beige\",\"brown\",\"white\"]},\"summary\":{\"total_objects\":8,\"scene_types\":[\"urban_street\",\"living_room\"],\"analysis_confidence\":0.88}}",
    "model": "gemini-2.5-pro",
    "finishReason": "stop",
    "usage": {
      "promptTokens": 1205,
      "completionTokens": 187,
      "totalTokens": 1392
    }
  }
}
```

### Step 4: Retrieve Session History (Optional)

```http
GET http://localhost:3000/api/sessions/cm5p0n9s70001hzxk8qj7nwvx
```

## System Prompts for Structured Output

To get structured JSON responses, you need system prompts configured with JSON schemas. Here are common examples:

### Object Detection Prompt

```json
{
  "id": "object_detection_prompt",
  "category": "Structured Output",
  "content": "Analyze images and detect objects with confidence scores and bounding boxes.",
  "jsonSchema": [
    {
      "name": "objects_detected",
      "type": "array",
      "arrayItemType": "object",
      "required": true,
      "description": "List of detected objects with details"
    },
    {
      "name": "scene_type",
      "type": "string",
      "required": true,
      "description": "Overall scene classification"
    },
    {
      "name": "total_objects",
      "type": "number",
      "required": true,
      "description": "Total count of detected objects"
    }
  ]
}
```

### Safety Compliance Prompt

```json
{
  "id": "safety_compliance_prompt",
  "category": "Structured Output",
  "content": "Analyze images for workplace safety compliance issues.",
  "jsonSchema": [
    {
      "name": "violations_detected",
      "type": "array",
      "arrayItemType": "object",
      "required": true,
      "description": "List of safety violations found"
    },
    {
      "name": "compliance_score",
      "type": "number",
      "required": true,
      "description": "Overall compliance score (0-100)"
    },
    {
      "name": "recommendations",
      "type": "array",
      "arrayItemType": "string",
      "required": false,
      "description": "Recommended actions to improve safety"
    }
  ]
}
```

## Code Examples

### JavaScript/Node.js (Stateless)

```javascript
async function analyzeImage(imageBase64, systemPromptId) {
  const response = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: [{
        role: 'user',
        content: 'Analyze this image for object detection'
      }],
      files: [{
        name: 'image.jpg',
        type: 'image/jpeg',
        data: imageBase64 // base64 without data URL prefix
      }],
      userId: 'user_01HZXK8QJ7NWVX5G2YBHD3FE4M',
      configurationId: 'config_01HZXK8QJ7NWVX5G2YBHD3FE4M',
      systemPromptId: systemPromptId
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    return JSON.parse(result.data.message); // Parse the structured JSON
  } else {
    throw new Error(result.error);
  }
}

// Usage
const structuredData = await analyzeImage(base64Image, 'object_detection_prompt');
console.log(structuredData.objects_detected);
```

### Python (Stateless)

```python
import requests
import json
import base64

def analyze_image(image_path, system_prompt_id):
    # Convert image to base64
    with open(image_path, 'rb') as img_file:
        img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
    
    payload = {
        "messages": [{
            "role": "user",
            "content": "Analyze this image for object detection"
        }],
        "files": [{
            "name": "image.jpg",
            "type": "image/jpeg",
            "data": img_base64  # base64 without data URL prefix
        }],
        "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
        "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
        "systemPromptId": system_prompt_id
    }
    
    response = requests.post(
        'http://localhost:3000/api/ai/chat',
        headers={'Content-Type': 'application/json'},
        json=payload
    )
    
    result = response.json()
    
    if result['success']:
        return json.loads(result['data']['message'])  # Parse structured JSON
    else:
        raise Exception(result['error'])

# Usage
structured_data = analyze_image('street_scene.jpg', 'object_detection_prompt')
print(structured_data['objects_detected'])
```

### cURL (Session-based)

```bash
# Step 1: Create session
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "title": "Image Analysis Session"
  }' | jq -r '.data.id')

# Step 2: Upload image
curl -X POST "http://localhost:3000/api/sessions/$SESSION_ID/messages" \
  -F "role=user" \
  -F "content=Analyze this image for safety compliance" \
  -F "files=@worksite_photo.jpg"

# Step 3: Get structured response
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"messages\": [{
      \"role\": \"user\",
      \"content\": \"Analyze this image for safety compliance\"
    }],
    \"userId\": \"user_01HZXK8QJ7NWVX5G2YBHD3FE4M\",
    \"configurationId\": \"config_01HZXK8QJ7NWVX5G2YBHD3FE4M\",
    \"sessionId\": \"$SESSION_ID\",
    \"systemPromptId\": \"safety_compliance_prompt\"
  }"
```

## Image Requirements

### Supported Formats
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- GIF (`.gif`)
- BMP (`.bmp`)

### Size Limits
- **Stateless**: ~10MB per image (base64 encoding limit)
- **Stateful**: Limited by server disk space and memory
- **Recommended**: Keep images under 5MB for optimal performance

### Base64 Encoding
When using the stateless flow with inline images:

```javascript
// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
    reader.readAsDataURL(file);
  });
}
```

## Error Handling

### Common Errors

**Invalid Configuration:**
```json
{
  "success": false,
  "error": "No active AI configuration found for user"
}
```

**Missing System Prompt:**
```json
{
  "success": false,
  "error": "System prompt not found"
}
```

**Invalid Image:**
```json
{
  "success": false,
  "error": "Failed to process image data"
}
```

**AI Provider Error:**
```json
{
  "success": false,
  "error": "Failed to generate AI response"
}
```

### Best Practices

1. **Always check the `success` field** in responses
2. **Handle base64 encoding errors** when preparing images
3. **Parse JSON responses** - structured outputs are returned as JSON strings
4. **Use appropriate image sizes** to avoid timeouts
5. **Implement retry logic** for network failures

## Authentication

Currently, authentication is handled via:
- **userId**: Identifies the user making the request
- **configurationId**: Specifies which AI configuration to use

Future versions may include API key authentication.

## Rate Limits

No explicit rate limits are currently implemented, but consider:
- **Image processing** can be resource-intensive
- **Large files** may cause timeouts
- **Concurrent requests** should be managed appropriately

## Getting Help

For issues with the API:
1. Check that your user ID and configuration ID are valid
2. Verify that your system prompt is configured for structured output
3. Ensure images are properly encoded (base64 for stateless, multipart for stateful)
4. Check server logs for detailed error information