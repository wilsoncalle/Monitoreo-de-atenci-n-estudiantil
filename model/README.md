# Teachable Machine Model Files

This directory is where you should place your exported Teachable Machine model files.

## How to Export Your Model from Teachable Machine

1. Go to [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Create a new Image Project with a webcam
3. Create three classes:
   - Class 1: "Atento" (Student paying attention)
   - Class 2: "Usando Celular" (Student using phone)
   - Class 3: "Dormido/Distraído" (Student sleeping/distracted)
4. Capture several images for each class (at least 30-50 per class for better accuracy)
5. Train the model by clicking the "Train Model" button
6. After training, click "Export Model"
7. Select "Tensorflow.js" as the format
8. Choose "Upload my model" or "Download my model"
9. If you downloaded the model, extract the files and place them in this directory

## Required Files

After exporting your model, you should have these files in this directory:

- `model.json` - The main model file
- `weights.bin` - The model weights
- `metadata.json` - Model metadata

## Testing Your Model

Once you've placed the model files in this directory, you can test the system by opening the main application in your web browser. The system will automatically load your model and start using it for attention detection.

## Important Notes

- Make sure your training data is diverse and covers different lighting conditions and angles
- For the "Atento" class, include images of yourself looking at the screen
- For the "Usando Celular" class, include images of yourself looking down at a phone
- For the "Dormido/Distraído" class, include images of yourself with closed eyes or looking away
