.PHONY:

package:
	mkdir package
	cp -r build/* package
	cp readme.md package
	cp tsconfig.json package
	cp package.json package
	tar -czf schema-openapi-0.0.2.tgz package
