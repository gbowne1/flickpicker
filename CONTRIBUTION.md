# Contributing to FlickPicker

Thank you for considering contributing to **FlickPicker**! This project is open-source and welcomes contributions from the community to improve and expand its functionality.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Code Changes](#submitting-code-changes)
- [Development Setup](#development-setup)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Style Guide](#style-guide)
- [License](#license)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](https://mozillascience.github.io/working-open-workshop/contributing/). Please treat others with respect and professionalism.

---

## How to Contribute

### Reporting Bugs

If you encounter a bug:

1. Check the [Issues](https://github.com/gbowne1/flickpicker/issues) tab to see if it has already been reported.
2. If not, create a new issue and include the following:
   - A clear and descriptive title.
   - Steps to reproduce the issue.
   - Expected and actual behavior.
   - Screenshots or logs, if applicable.

### Suggesting Features

We welcome feature requests! To suggest a feature:

1. Check the [Issues](https://github.com/gbowne1/flickpicker/issues) tab to see if it has already been suggested.
2. If not, create a new issue and include the following:
   - A clear and descriptive title.
   - A detailed explanation of the feature and its benefits.
   - Any relevant examples or references.

### Submitting Code Changes

To contribute code:

1. Fork the repository and clone it locally.
2. Create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and commit them with a clear, descriptive message:

   ```bash
   git commit -m "Add feature: your-feature-name"
   ```
4. Push your branch to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request (PR) to the main branch of the original repository. Be sure to include:
   - A clear title and description of your changes.
   - Any relevant issue numbers (e.g., Closes #123).

## Development Setup

### Backend

1. Navigate to the Backend directory:

```bash
cd Backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the backend server:

```bash
npm start
```

### Frontend

1. Navigate to the Frontend/client directory:

```bash
cd Frontend/client
```

2. Install dependencies:

```bash
npm install
```

3. Serve the frontend using a static file server or development server (e.g., with Vite, React, or Next.js):

```bash
npm start
```

## Style Guide

- HTML/CSS: Use semantic HTML and follow best practices for accessibility.
- Commit Messages: Use clear and descriptive commit messages.

  Example:

  ```bash
  git commit -m "Fix: resolve login button not responding on mobile"
  ```

## License

All contributions submitted to this repository shall be licensed under the MIT License.

Thank you for contributing to FlickPicker! Together, we can make this project better for everyone.