#!/usr/bin/env bash
# Reorganize til/health/ into subcategories matching the old VitePress structure
set -e

HEALTH="/home/tianhe/projects/blog/content/til/health"

cd "$HEALTH"

# Create subcategory dirs
mkdir -p pharma physio patho labs refs

# 药理学 (pharma)
mv nsaids.org prostaglandins-ibuprofen.org pharma/

# 生理学 (physio)
mv kidney.org erythropoiesis-epo.org physio/

# 病理生理学 (patho)
mv ckd.org renal-anemia.org patho/

# 生活常识 (labs) — all everyday health files
mv blood-pressure.org blood-glucose-diabetes.org lab-tests.org \
   fever.org sleep-insomnia.org vitamins-minerals.org penis-exercise-manual.org \
   body-metrics.org healthy-diet-by-who.org \
   labs/

# 参考来源 (refs)
mkdir -p refs
mv ref-*.org references-index.org refs/

echo "Done. Files moved:"
for d in pharma physio patho labs refs; do
    count=$(ls "$d"/*.org 2>/dev/null | wc -l)
    echo "  $d/ — $count files"
done
remaining=$(ls *.org 2>/dev/null | wc -l)
echo "  (root) — $remaining files (not categorized)"
