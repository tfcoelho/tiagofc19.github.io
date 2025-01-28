import os
from PIL import Image

# Configuration
INPUT_FOLDER = "Images"  # Replace with the path to your folder of .webp images
OUTPUT_FOLDER = "mid_images"  # Output folder for mid-quality images
TARGET_WIDTH = 800  # Target width for mid-res images (height will be calculated to maintain ratio)
QUALITY = 85  # Quality for saving the images (0-100)

# Create the output folder if it doesn't exist
if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)

# Process each image in the input folder
for filename in os.listdir(INPUT_FOLDER):
    if filename.endswith(".webp"):
        # Open the image
        image_path = os.path.join(INPUT_FOLDER, filename)
        with Image.open(image_path) as img:
            # Calculate new dimensions while maintaining aspect ratio
            original_width, original_height = img.size
            aspect_ratio = original_height / original_width
            new_width = TARGET_WIDTH
            new_height = int(new_width * aspect_ratio)

            # Resize to mid resolution while maintaining aspect ratio
            img_mid_res = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Save the mid-resolution image with the same name
            output_path = os.path.join(OUTPUT_FOLDER, filename)
            img_mid_res.save(output_path, "WEBP", quality=QUALITY)

        print(f"Processed: {filename} -> {output_path}")

print("All images processed successfully!")