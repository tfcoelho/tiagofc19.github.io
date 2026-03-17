import os
from PIL import Image

# Configuration
INPUT_FOLDER = "Images"  # Replace with the path to your folder of .webp images
OUTPUT_FOLDER = "mid_images"  # Output folder for mid-quality images
DOWNSAMPLING_CONSTANT = 0.2  # Resize images to 50% of their original dimensions (adjust as needed)
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
            # Calculate new dimensions proportionally
            original_width, original_height = img.size
            new_width = int(original_width * DOWNSAMPLING_CONSTANT)
            new_height = int(original_height * DOWNSAMPLING_CONSTANT)

            # Resize to mid resolution while maintaining aspect ratio
            img_mid_res = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Save the mid-resolution image with the same name
            output_path = os.path.join(OUTPUT_FOLDER, filename)
            img_mid_res.save(output_path, "WEBP", quality=QUALITY)

        print(f"Processed: {filename} -> {output_path} (New size: {new_width}x{new_height})")

print("All images processed successfully!")