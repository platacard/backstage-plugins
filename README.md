# Backstage Plugins Collection

A collection of custom Backstage plugins developed by Platacard.

## Development

### Project Structure

```
├── plugins/
│   ├── scaffolder-backend-module-json-merge-action/
│   └── scaffolder-backend-module-yaml-merge-actions/
├── examples/
│   └── template/
├── scripts/
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Development Workflow

```bash
# Install dependencies
yarn install

# Start development
yarn start

# Make changes and test
yarn test

# Ensure code quality
yarn lint
yarn prettier:check
```

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for
version management and publishing.

To create a changeset:

```bash
yarn changeset
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for
details.

## Support

For issues and questions:

- Open an issue in this repository
- Check the [Backstage documentation](https://backstage.io/docs)
- Review plugin-specific README files in the `plugins/` directory

---

Built with ❤️ for the Backstage community by Platacard.
