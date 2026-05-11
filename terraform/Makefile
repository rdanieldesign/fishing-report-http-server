.PHONY: plan-dev apply-dev plan-prod apply-prod

plan-dev:
	terraform workspace select dev && terraform plan -var-file="terraform.dev.tfvars"

apply-dev:
	terraform workspace select dev && terraform apply -var-file="terraform.dev.tfvars"

plan-prod:
	terraform workspace select prod && terraform plan

apply-prod:
	terraform workspace select prod && terraform apply
