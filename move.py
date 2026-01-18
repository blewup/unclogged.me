import os

# --- Configuration ---
TARGET_DIR = './pages' 
EXTENSIONS = ('.html')

# TRIPLE QUOTES (""") allow us to paste the exact multi-line HTML block safely.
# This block must match your files EXACTLY (spaces, newlines, indentation).


# The replacement text (using triple quotes for safety)
REPLACE_TEXT = '''<script src="assets/scripts/navbar.js" defer></script>
    <script src="assets/scripts/seofr.js" defer></script>
    <script src="assets/scripts/seoen.js" defer></script>'''

def process_files():
    count = 0
    print(f"Scanning directory: {os.path.abspath(TARGET_DIR)}...\n")

    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file.lower().endswith(EXTENSIONS):
                file_path = os.path.join(root, file)
                try:
                    # Read the file
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    # Check for Exact Match
                    if SEARCH_TEXT in content:
                        print(f"[MODIFYING] {file_path}")
                        
                        # Perform replacement
                        new_content = content.replace(SEARCH_TEXT, REPLACE_TEXT)
                        
                        # Write changes
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        count += 1
                        
                except Exception as e:
                    print(f"[ERROR] Could not read {file_path}: {e}")

    print(f"\nDone. Updated {count} files.")

if __name__ == "__main__":
    process_files()
