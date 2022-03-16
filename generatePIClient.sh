set -ex

# run openapi client js generator
openapi -i openapi_specification.yaml \
    --indent 2 \
    -o src/pi-api \
    --name PIClient

# endpoints with : (colon) produce invalid func names, convert them to camelcase
find ./src/pi-api/services -name '*.ts' \
    -exec sed -Ei 's/public (.*?):(.*?)(\(\): CancelablePromise.*)/\1\u\2\3/g' {} +

# run prettier so that diffs match
prettier -w src/pi-api

# typescript complains of missing any type here, removing override fixes it
find ./src/pi-api/core -name '*.ts' \
    -exec sed -Ei \
        's/public override/public/g' {} +

# the type intersection overrides the result to any, this fixes it to be child type
find ./src/pi-api/models -name '*.ts' \
    -exec sed -Ei 's/Envelope &/Omit<Envelope, "result"> \&/g' {} +