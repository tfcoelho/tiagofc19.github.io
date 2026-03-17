import os
from PIL import Image, ImageFilter

# Configuration
INPUT_FOLDER = "Images"  # Replace with the path to your folder of .webp images
OUTPUT_FOLDER = "blurred_images"  # Output folder for blurred images
BLUR_RADIUS = 10  # Adjust blur intensity
TARGET_WIDTH = 50   # Target resolution for low-res images

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

            # Resize to low resolution while maintaining aspect ratio
            img_low_res = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Apply blur
            img_blurred = img_low_res.filter(ImageFilter.GaussianBlur(radius=BLUR_RADIUS))

            # Save the blurred image with "_blur" suffix
            output_filename = os.path.splitext(filename)[0] + "_blur.webp"
            output_path = os.path.join(OUTPUT_FOLDER, output_filename)
            img_blurred.save(output_path, "WEBP")

        print(f"Processed: {filename} -> {output_filename}")

print("All images processed successfully!")