import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock S3 API
 * Handles requests to /api/mock/s3/* and returns mock S3 upload responses
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    console.log('☁️ Mock S3 file requested:', path);

    // Parse the S3 path
    const [bucket, ...filePath] = path.split('/');
    const filename = filePath[filePath.length - 1];
    const fileExtension = filename.split('.').pop()?.toLowerCase();

    // Generate mock S3 object metadata
    const mockS3Object = generateMockS3Object(bucket, filePath.join('/'), filename, fileExtension);

    // For image files, try to serve the actual file from local storage
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(fileExtension || '')) {
      console.log('🔍 Image file requested. Extension:', fileExtension);
      console.log('🔍 Full path:', path);
      console.log('🔍 Bucket:', bucket);
      console.log('🔍 FilePath:', filePath);
      
      try {
        const localFilePath = path; // path already contains 'mails/' prefix
        console.log('🖼️ Attempting to serve image from:', localFilePath);
        
        const fs = await import('fs/promises');
        console.log('📂 About to read file:', localFilePath);
        const fileBuffer = await fs.readFile(localFilePath);
        console.log('✅ File read successfully, size:', fileBuffer.length);
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': getContentType(fileExtension),
            'X-Mock-S3': 'true',
            'X-S3-Bucket': bucket,
            'X-S3-Key': encodeURIComponent(filePath.join('/')),
            'Cache-Control': 'public, max-age=3600',
            'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`
          }
        });
      } catch (fileError) {
        console.error('⚠️ Could not serve image file, falling back to metadata. Error:', fileError.message);
        console.error('⚠️ Error details:', fileError);
        // Fall through to return JSON metadata
      }
    }

    // Return appropriate response based on file type
    if (fileExtension === 'html') {
      return new NextResponse(mockS3Object.content, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'X-Mock-S3': 'true',
          'X-S3-Bucket': bucket,
          'X-S3-Key': encodeURIComponent(filePath.join('/')),
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } else {
      return NextResponse.json(mockS3Object, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Mock-S3': 'true',
          'X-S3-Bucket': bucket,
          'Cache-Control': 'no-cache'
        }
      });
    }

  } catch (error) {
    console.error('❌ Mock S3 error:', error);
    return NextResponse.json({
      error: 'Mock S3 object generation failed',
      path: params.path.join('/'),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const body = await request.json();
    console.log('☁️ Mock S3 upload requested:', path);

    // Simulate S3 upload
    const uploadResult = simulateS3Upload(path, body);

    return NextResponse.json(uploadResult, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-S3-Upload': 'true',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Mock S3 upload error:', error);
    return NextResponse.json({
      error: 'Mock S3 upload failed',
      path: params.path.join('/'),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function generateMockS3Object(bucket: string, key: string, filename: string, fileExtension?: string): any {
  const timestamp = new Date().toISOString();
  const size = Math.floor(Math.random() * 50000) + 2000; // 2-52KB

  const baseObject: any = {
    type: 'mock_s3_object',
    bucket: bucket,
    key: key,
    filename: filename,
    size: size,
    content_type: getContentType(fileExtension),
    last_modified: timestamp,
    etag: `"${Math.random().toString(36).substr(2, 32)}"`,
    url: `http://localhost:3000/api/mock/s3/${bucket}/${key}`,
    public_url: `https://${bucket}.s3.amazonaws.com/${key}`,
    mock_metadata: {
      generated_at: timestamp,
      mock_service: 's3',
      note: 'This is mock S3 data for development/testing purposes'
    }
  };

  // Add content for HTML files
  if (fileExtension === 'html') {
    baseObject.content = generateMockEmailHTML(filename);
  }

  return baseObject;
}

function simulateS3Upload(path: string, uploadData: any) {
  const timestamp = new Date().toISOString();
  const [bucket, ...keyParts] = path.split('/');
  const key = keyParts.join('/');
  const filename = key.split('/').pop() || 'unknown';

  return {
    type: 'mock_s3_upload_result',
    success: true,
    bucket: bucket,
    key: key,
    filename: filename,
    size: uploadData?.content ? uploadData.content.length : 2847,
    content_type: uploadData?.content_type || 'text/html',
    url: `http://localhost:3000/api/mock/s3/${path}`,
    public_url: `https://${bucket}.s3.amazonaws.com/${key}`,
    etag: `"${Math.random().toString(36).substr(2, 32)}"`,
    version_id: `${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
    uploaded_at: timestamp,
    upload_duration_ms: 1200,
    mock_metadata: {
      generated_at: timestamp,
      mock_service: 's3_upload',
      note: 'This simulates successful S3 upload for development/testing',
      cost_savings: 'Using mock S3 for development - no AWS charges'
    }
  };
}

function getContentType(fileExtension?: string) {
  const contentTypes = {
    'html': 'text/html',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'pdf': 'application/pdf',
    'zip': 'application/zip'
  };
  return contentTypes[fileExtension || 'html'] || 'application/octet-stream';
}

function generateMockEmailHTML(filename: string): string {
  const timestamp = new Date().toLocaleString();
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏛️ Москва ждет! Билеты от 7,253 ₽</title>
    <style type="text/css">
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .price { background-color: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
        .cta { background-color: #ff6b35; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Москва ждет вас!</h1>
            <p>Откройте для себя столицу России по специальным ценам</p>
        </div>
        
        <div class="content">
            <h2>Мечтаете о поездке в сердце России?</h2>
            <p>Москва — это удивительный город, где история встречается с современностью! Специально для жителей Санкт-Петербурга мы подготовили лучшие предложения на авиабилеты.</p>
            
            <div class="price">
                <h3>✈️ Специальные цены на февраль 2025:</h3>
                <ul>
                    <li><strong>LED → MOW:</strong> от 7,253 ₽ (1 февраля)</li>
                    <li><strong>LED → MOW:</strong> от 8,150 ₽ (8 февраля)</li>
                    <li><strong>LED → MOW:</strong> от 7,890 ₽ (15 февраля)</li>
                </ul>
            </div>
            
            <h3>🎯 Что вас ждет в Москве:</h3>
            <ul>
                <li>🏛️ Красная площадь и Кремль</li>
                <li>🎭 Большой театр и Третьяковская галерея</li>
                <li>🍽️ Изысканная русская кухня</li>
                <li>🛍️ Торговые центры и бутики</li>
            </ul>
            
            <p>Не упустите возможность посетить столицу по выгодным ценам! Бронируйте билеты сейчас и получите гарантию лучшей цены.</p>
            
            <a href="https://kupibilet.ru" class="cta">Найти билеты →</a>
        </div>
        
        <div class="footer">
            <p>С уважением, команда Kupibilet<br>
            Ваши надежные помощники в путешествиях</p>
            <p style="font-size: 12px; color: #999;">
                Mock S3 File: ${filename}<br>
                Generated: ${timestamp}
            </p>
        </div>
    </div>
</body>
</html>`;
} 